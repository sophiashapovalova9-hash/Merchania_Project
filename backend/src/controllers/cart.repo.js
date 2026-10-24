import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

const CART_COLUMNS = `
    c.CartItemID     AS cart_item_id,
    c.Quantity       AS quantity,
    p.ProductID      AS product_id,
    p.Title          AS title,
    p.Price          AS price,
    p.StockQuantity  AS stock,
    p.Price * c.Quantity AS line_total,
    a.ShopName       AS shop_name,
    main_img.ImageURL AS image_url`;

const CART_JOINS = `
    JOIN Product p ON p.ProductID = c.ProductID
    JOIN ArtistDetail a ON a.ArtistID = p.ArtistID
    LEFT JOIN LATERAL (
      SELECT m.ImageURL
      FROM ProductMedia m
      WHERE m.ProductID = p.ProductID
      ORDER BY m.IsMain DESC, m.MediaID
      LIMIT 1
    ) main_img ON true`;

export async function listCart(userId) {
  const { rows } = await getDb().query(
    `
    SELECT ${CART_COLUMNS}
    FROM Cart c${CART_JOINS}
    WHERE c.UserID = @userId
    ORDER BY c.CartItemID;`,
    { userId: q.int(userId) },
  );
  return rows;
}

export async function getCartSummary(userId) {
  const { rows } = await getDb().query(
    `
    SELECT COALESCE(SUM(p.Price * c.Quantity), 0) AS subtotal,
           COALESCE(SUM(c.Quantity), 0)           AS items_count
    FROM Cart c
    JOIN Product p ON p.ProductID = c.ProductID
    WHERE c.UserID = @userId;`,
    { userId: q.int(userId) },
  );
  return rows[0] ?? { subtotal: 0, items_count: 0 };
}

export async function addItem(userId, productId, quantity) {
  const db = getDb();
  const { rows } = await db.query('SELECT StockQuantity AS stock FROM Product WHERE ProductID = @productId;', {
    productId: q.int(productId),
  });
  if (!rows[0]) return { error: { status: 404, message: 'Товар не найден' } };

  const { rows: current } = await db.query('SELECT Quantity AS quantity FROM Cart WHERE UserID = @userId AND ProductID = @productId;', {
    userId: q.int(userId),
    productId: q.int(productId),
  });

  const wanted = (current[0]?.quantity ?? 0) + quantity;
  if (wanted > rows[0].stock) {
    return { error: { status: 409, message: `Недостаточно остатка: доступно ${rows[0].stock} шт.` } };
  }

  await db.query(
    `
    INSERT INTO Cart (UserID, ProductID, Quantity)
    VALUES (@userId, @productId, @quantity)
    ON CONFLICT (userid, productid)
    DO UPDATE SET Quantity = Cart.Quantity + EXCLUDED.Quantity;`,
    { userId: q.int(userId), productId: q.int(productId), quantity: q.int(quantity) },
  );

  return { items: await listCart(userId) };
}

export async function setQuantity(userId, productId, quantity) {
  const db = getDb();
  const { rows } = await db.query('SELECT StockQuantity AS stock FROM Product WHERE ProductID = @productId;', {
    productId: q.int(productId),
  });
  if (!rows[0]) return { error: { status: 404, message: 'Товар не найден' } };
  if (quantity > rows[0].stock) {
    return { error: { status: 409, message: `Недостаточно остатка: доступно ${rows[0].stock} шт.` } };
  }

  await db.query('UPDATE Cart SET Quantity = @quantity WHERE UserID = @userId AND ProductID = @productId;', {
    userId: q.int(userId),
    productId: q.int(productId),
    quantity: q.int(quantity),
  });
  return { items: await listCart(userId) };
}

export async function removeItem(userId, productId) {
  await getDb().query('DELETE FROM Cart WHERE UserID = @userId AND ProductID = @productId;', {
    userId: q.int(userId),
    productId: q.int(productId),
  });
  return { items: await listCart(userId) };
}

export async function clearCart(userId) {
  await getDb().query('DELETE FROM Cart WHERE UserID = @userId;', { userId: q.int(userId) });
}
