import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

const STATUS_NEW = 'Новый';

const ORDER_COLUMNS = `
    o.OrderID        AS order_id,
    o.OrderDate      AS order_date,
    o.TotalAmount    AS total_amount,
    o.ShippingAddress AS shipping_address,
    o.TrackingNumber AS tracking_number,
    o.BuyerID        AS buyer_id,
    st.StatusName    AS status_name,
    buyer.Email      AS buyer_email`;

export async function listByBuyer(buyerId) {
  const { rows } = await getDb().query(
    `
    SELECT ${ORDER_COLUMNS},
           COALESCE(items.item_count, 0) AS item_count
    FROM Orders o
    JOIN OrderStatus st ON st.StatusID = o.StatusID
    JOIN UserAccount buyer ON buyer.UserID = o.BuyerID
    LEFT JOIN LATERAL (
      SELECT SUM(oi.Quantity) AS item_count FROM OrderItem oi WHERE oi.OrderID = o.OrderID
    ) items ON true
    WHERE o.BuyerID = @buyerId
    ORDER BY o.OrderDate DESC, o.OrderID DESC;`,
    { buyerId: q.int(buyerId) },
  );
  return rows;
}

export async function getOrder(orderId) {
  const { rows } = await getDb().query(
    `
    SELECT ${ORDER_COLUMNS},
           COALESCE(items.item_count, 0) AS item_count
    FROM Orders o
    JOIN OrderStatus st ON st.StatusID = o.StatusID
    JOIN UserAccount buyer ON buyer.UserID = o.BuyerID
    LEFT JOIN LATERAL (
      SELECT SUM(oi.Quantity) AS item_count FROM OrderItem oi WHERE oi.OrderID = o.OrderID
    ) items ON true
    WHERE o.OrderID = @orderId;`,
    { orderId: q.int(orderId) },
  );
  return rows[0] ?? null;
}

export async function listOrderItems(orderId) {
  const { rows } = await getDb().query(
    `
    SELECT oi.OrderItemID AS order_item_id,
           oi.ProductID   AS product_id,
           oi.Quantity    AS quantity,
           oi.UnitPrice   AS unit_price,
           oi.Quantity * oi.UnitPrice AS line_total,
           p.Title        AS title,
           a.ShopName     AS shop_name,
           main_img.ImageURL AS image_url
    FROM OrderItem oi
    JOIN Product p ON p.ProductID = oi.ProductID
    JOIN ArtistDetail a ON a.ArtistID = p.ArtistID
    LEFT JOIN LATERAL (
      SELECT m.ImageURL
      FROM ProductMedia m
      WHERE m.ProductID = p.ProductID
      ORDER BY m.IsMain DESC, m.MediaID
      LIMIT 1
    ) main_img ON true
    WHERE oi.OrderID = @orderId;`,
    { orderId: q.int(orderId) },
  );
  return rows;
}

export async function checkout({ buyerId, shippingAddress, paymentMethod }) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const { rows: items } = await tx.query(
      `
      SELECT c.ProductID AS product_id, c.Quantity AS quantity, p.Title AS title, p.Price AS price, p.StockQuantity AS stock
      FROM Cart c
      JOIN Product p ON p.ProductID = c.ProductID
      WHERE c.UserID = @buyerId
      FOR UPDATE OF c, p;`,
      { buyerId: q.int(buyerId) },
    );

    if (items.length === 0) return { error: { status: 409, message: 'Корзина пуста' } };

    const shortage = items.find((i) => i.stock < i.quantity);
    if (shortage) {
      return {
        error: { status: 409, message: `Недостаточно остатка: "${shortage.title}" (нужно ${shortage.quantity}, есть ${shortage.stock})` },
      };
    }

    const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    const { rows: orderRows } = await tx.query(
      `
      INSERT INTO Orders (BuyerID, StatusID, OrderDate, TotalAmount, ShippingAddress, TrackingNumber)
      VALUES (
        @buyerId,
        (SELECT StatusID FROM OrderStatus WHERE StatusName = @statusName),
        now(),
        @total,
        @shippingAddress,
        NULL
      )
      RETURNING OrderID AS order_id, TotalAmount AS total_amount;`,
      {
        buyerId: q.int(buyerId),
        statusName: q.text(STATUS_NEW, 50),
        total: q.money(total),
        shippingAddress: q.text(shippingAddress, 500),
      },
    );

    const orderId = orderRows[0]?.order_id;
    if (!orderId) return { error: { status: 500, message: 'Не удалось создать заказ' } };

    await tx.query(
      `
      INSERT INTO OrderItem (OrderID, ProductID, Quantity, UnitPrice)
      SELECT @orderId, c.ProductID, c.Quantity, p.Price
      FROM Cart c
      JOIN Product p ON p.ProductID = c.ProductID
      WHERE c.UserID = @buyerId;`,
      { orderId: q.int(orderId), buyerId: q.int(buyerId) },
    );

    await tx.query(
      `
      UPDATE Product AS p
      SET StockQuantity = p.StockQuantity - c.Quantity
      FROM Cart AS c
      WHERE c.ProductID = p.ProductID AND c.UserID = @buyerId;`,
      { buyerId: q.int(buyerId) },
    );

    await tx.query('DELETE FROM Cart WHERE UserID = @buyerId;', { buyerId: q.int(buyerId) });

    return { orderId, total, itemsCount: items.reduce((sum, i) => sum + i.quantity, 0), paymentMethod };
  });
}

export async function updateStatus(orderId, statusName, trackingNumber = null) {
  await getDb().query(
    `
    UPDATE Orders SET StatusID = (SELECT StatusID FROM OrderStatus WHERE StatusName = @statusName),
           TrackingNumber = COALESCE(@trackingNumber, TrackingNumber)
    WHERE OrderID = @orderId;`,
    { orderId: q.int(orderId), statusName: q.text(statusName, 50), trackingNumber: q.text(trackingNumber, 100) },
  );
  return getOrder(orderId);
}

export async function listStatuses() {
  const { rows } = await getDb().query('SELECT StatusID AS status_id, StatusName AS status_name FROM OrderStatus ORDER BY StatusID;');
  return rows;
}
