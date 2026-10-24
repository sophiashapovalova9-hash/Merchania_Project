import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MOCK_DB = 'true';

const { createMockDb } = await import('../src/db/mock.js');

const raw = async (sql, inputs = {}) => {
  const db = createMockDb();
  return (await db.query(sql, inputs)).rows;
};

test('заказ покупателя не перехватывается запросом художника', async () => {
  const buyer = await raw(
    `SELECT o.OrderID AS order_id FROM Orders o WHERE o.OrderID = @orderId;`,
    { orderId: { type: 'Int', value: 1 } },
  );
  assert.equal(buyer.length, 1);
  assert.equal(buyer[0].order_id, 1);
});

test('запрос художника по заказу не отдаёт чужой заказ', async () => {

  const mine = await raw(
    `SELECT DISTINCT o.OrderID AS order_id FROM Orders o WHERE o.OrderID = @orderId AND p.ArtistID = @artistId;`,
    { orderId: { type: 'Int', value: 1 }, artistId: { type: 'Int', value: 1 } },
  );
  assert.equal(mine.length, 1);

  const foreign = await raw(
    `SELECT DISTINCT o.OrderID AS order_id FROM Orders o WHERE o.OrderID = @orderId AND p.ArtistID = @artistId;`,
    { orderId: { type: 'Int', value: 1 }, artistId: { type: 'Int', value: 2 } },
  );
  assert.equal(foreign.length, 0);
});

test('UPDATE статуса заказа не принимается за SELECT заказа', async () => {
  const db = createMockDb();
  await db.query(
    `UPDATE o SET o.StatusID = (SELECT StatusID FROM OrderStatus WHERE StatusName = @statusName) FROM Orders o WHERE o.OrderID = @orderId;`,
    { orderId: { type: 'Int', value: 1 }, statusName: { type: 'NVarChar', value: 'Сборка' }, trackingNumber: { type: 'NVarChar', value: 'BB-1' } },
  );

  const { rows } = await db.query(
    `SELECT o.OrderID AS order_id FROM Orders o WHERE o.OrderID = @orderId;`,
    { orderId: { type: 'Int', value: 1 } },
  );
  assert.equal(rows[0].status_name, 'Сборка');
  assert.equal(rows[0].tracking_number, 'BB-1');
});

test('справочник статусов не подменяет запросы с подзапросом к OrderStatus', async () => {

  const rows = await raw(
    `SELECT a.ArtistID AS artist_id, a.ShopName AS shop_name
     FROM ArtistDetail a
     WHERE a.ArtistID = @artistId;`,
    { artistId: { type: 'Int', value: 1 } },
  );
  assert.equal(rows[0].shop_name, 'Studio_Pan');
});

test('каталог уважает пагинацию', async () => {
  const db = createMockDb();
  const count = await db.query('SELECT COUNT(*) AS total FROM Product p WHERE 1 = 1;', {});
  assert.equal(count.rows[0].total, 9);

  const page1 = await db.query(
    'SELECT TOP (@limit) p.ProductID AS product_id FROM Product p WHERE 1 = 1 ORDER BY p.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;',
    { limit: { type: 'Int', value: 4 }, offset: { type: 'Int', value: 0 } },
  );
  const page3 = await db.query(
    'SELECT TOP (@limit) p.ProductID AS product_id FROM Product p WHERE 1 = 1 ORDER BY p.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;',
    { limit: { type: 'Int', value: 4 }, offset: { type: 'Int', value: 8 } },
  );
  assert.equal(page1.rows.length, 4);
  assert.equal(page3.rows.length, 1);
});

test('неизвестный запрос падает явно, а не отдаёт пустоту', async () => {
  const db = createMockDb();
  await assert.rejects(() => db.query('SELECT * FROM TableThatDoesNotExist;', {}), /нет обработчика/);
});
