import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

export async function getArtist(artistId) {
  const { rows } = await getDb().query(
    `
    SELECT a.ArtistID AS artist_id, a.ShopName AS shop_name, a.Bio AS bio,
           CAST(a.Rating AS FLOAT) AS rating,
           ua.Email AS email,
           up.FirstName AS first_name, up.LastName AS last_name,
           (SELECT COUNT(*) FROM Product p WHERE p.ArtistID = a.ArtistID) AS product_count,
           (SELECT COUNT(DISTINCT o.OrderID)
              FROM Orders o
              JOIN OrderItem oi ON oi.OrderID = o.OrderID
              JOIN Product p ON p.ProductID = oi.ProductID
             WHERE p.ArtistID = a.ArtistID) AS order_count,
           (SELECT COUNT(DISTINCT o.OrderID)
              FROM Orders o
              JOIN OrderItem oi ON oi.OrderID = o.OrderID
              JOIN Product p ON p.ProductID = oi.ProductID
             WHERE p.ArtistID = a.ArtistID AND o.StatusID = (SELECT StatusID FROM OrderStatus WHERE StatusName = 'Завершён')) AS completed_order_count,
           (SELECT COALESCE(SUM(oi.Quantity * oi.UnitPrice), 0)
              FROM OrderItem oi
              JOIN Orders o ON o.OrderID = oi.OrderID
              JOIN Product p ON p.ProductID = oi.ProductID
             WHERE p.ArtistID = a.ArtistID AND o.StatusID = (SELECT StatusID FROM OrderStatus WHERE StatusName = 'Завершён')) AS income_total
    FROM ArtistDetail a
    JOIN UserAccount ua ON ua.UserID = a.UserID
    LEFT JOIN UserProfile up ON up.UserID = a.UserID
    WHERE a.ArtistID = @artistId;`,
    { artistId: q.int(artistId) },
  );
  return rows[0] ?? null;
}

export async function getArtistOrder(orderId, artistId) {
  const { rows } = await getDb().query(
    `
    SELECT DISTINCT o.OrderID AS order_id, o.OrderDate AS order_date, o.TotalAmount AS total_amount,
           o.ShippingAddress AS shipping_address, o.TrackingNumber AS tracking_number,
           st.StatusName AS status_name, up.FirstName AS buyer_first_name, up.LastName AS buyer_last_name
    FROM Orders o
    JOIN OrderItem oi ON oi.OrderID = o.OrderID
    JOIN Product p ON p.ProductID = oi.ProductID
    JOIN OrderStatus st ON st.StatusID = o.StatusID
    LEFT JOIN UserProfile up ON up.UserID = o.BuyerID
    WHERE o.OrderID = @orderId AND p.ArtistID = @artistId;`,
    { orderId: q.int(orderId), artistId: q.int(artistId) },
  );
  return rows[0] ?? null;
}

export async function listArtistOrders(artistId) {
  const { rows } = await getDb().query(
    `
    SELECT o.OrderID AS order_id, o.OrderDate AS order_date, st.StatusName AS status_name,
           o.TrackingNumber AS tracking_number, o.TotalAmount AS order_total,
           COALESCE(SUM(oi.Quantity), 0) AS units,
           COALESCE(SUM(oi.Quantity * oi.UnitPrice), 0) AS artist_total,
           ua.Email AS buyer_email
    FROM Orders o
    JOIN OrderStatus st ON st.StatusID = o.StatusID
    JOIN UserAccount ua ON ua.UserID = o.BuyerID
    JOIN OrderItem oi ON oi.OrderID = o.OrderID
    JOIN Product p ON p.ProductID = oi.ProductID
    WHERE p.ArtistID = @artistId
    GROUP BY o.OrderID, o.OrderDate, st.StatusName, o.TrackingNumber, o.TotalAmount, ua.Email
    ORDER BY o.OrderDate DESC, o.OrderID DESC;`,
    { artistId: q.int(artistId) },
  );
  return rows;
}

export async function getAnalytics(artistId) {
  const { rows } = await getDb().query(
    `
    SELECT COUNT(DISTINCT a.OrderID) AS orders_total,
           COALESCE(SUM(CASE WHEN a.IsCompleted = 1 THEN a.OrderSum END), 0) AS income_total,
           COALESCE(AVG(CASE WHEN a.IsCompleted = 1 THEN a.OrderSum END), 0) AS avg_check,
           COALESCE(SUM(a.Units), 0) AS units_sold,
           (SELECT COALESCE(SUM(p.StockQuantity), 0) FROM Product p WHERE p.ArtistID = @artistId) AS stock_total
    FROM (
        SELECT o.OrderID,
               SUM(oi.Quantity) AS Units,
               SUM(oi.Quantity * oi.UnitPrice) AS OrderSum,
               CASE WHEN o.StatusID = (SELECT StatusID FROM OrderStatus WHERE StatusName = 'Завершён') THEN 1 ELSE 0 END AS IsCompleted
        FROM OrderItem oi
        JOIN Product p ON p.ProductID = oi.ProductID
        JOIN Orders o ON o.OrderID = oi.OrderID
        WHERE p.ArtistID = @artistId
        GROUP BY o.OrderID, o.StatusID
    ) a;`,
    { artistId: q.int(artistId) },
  );
  return rows[0];
}

export async function getTopProducts(artistId, top = 5) {
  const { rows } = await getDb().query(
    `
    SELECT oi.ProductID AS product_id,
           p.Title AS title,
           SUM(oi.Quantity) AS quantity_sold,
           SUM(oi.Quantity * oi.UnitPrice) AS revenue
    FROM OrderItem oi
    JOIN Product p ON p.ProductID = oi.ProductID
    WHERE p.ArtistID = @artistId
    GROUP BY oi.ProductID, p.Title
    ORDER BY quantity_sold DESC
    LIMIT @top;`,
    { artistId: q.int(artistId), top: q.int(top) },
  );
  return rows;
}

export async function listArtistProducts(artistId) {
  const { rows } = await getDb().query(
    `
    SELECT p.ProductID AS product_id, p.Title AS title, p.Price AS price,
           p.StockQuantity AS stock, c.CategoryName AS category_name, f.FandomName AS fandom_name
    FROM Product p
    JOIN Category c ON c.CategoryID = p.CategoryID
    JOIN Fandom f ON f.FandomID = p.FandomID
    WHERE p.ArtistID = @artistId
    ORDER BY p.CreatedAt DESC, p.ProductID DESC;`,
    { artistId: q.int(artistId) },
  );
  return rows;
}

export async function createArtistProduct(artistId, data) {
  await getDb().query(
    `
    INSERT INTO Product (ArtistID, CategoryID, FandomID, Title, Description, Price, StockQuantity)
    VALUES (@artistId, @categoryId, @fandomId, @title, @description, @price, @stock);`,
    {
      artistId: q.int(artistId),
      categoryId: q.int(data.categoryId),
      fandomId: q.int(data.fandomId),
      title: q.text(data.title, 200),
      description: q.text(data.description, 4000),
      price: q.money(data.price),
      stock: q.int(data.stock ?? 0),
    },
  );
  return listArtistProducts(artistId);
}

export async function updateArtistProduct(artistId, productId, data) {
  await getDb().query(
    `
    UPDATE Product
       SET Title = @title, Description = @description, Price = @price,
           StockQuantity = @stock, CategoryID = @categoryId, FandomID = @fandomId
     WHERE ProductID = @productId AND ArtistID = @artistId;`,
    {
      productId: q.int(productId),
      artistId: q.int(artistId),
      categoryId: q.int(data.categoryId),
      fandomId: q.int(data.fandomId),
      title: q.text(data.title, 200),
      description: q.text(data.description, 4000),
      price: q.money(data.price),
      stock: q.int(data.stock),
    },
  );
  return listArtistProducts(artistId);
}

export async function setStock(artistId, productId, stock) {
  await getDb().query('UPDATE Product SET StockQuantity = @stock WHERE ProductID = @productId AND ArtistID = @artistId;', {
    productId: q.int(productId),
    artistId: q.int(artistId),
    stock: q.int(stock),
  });
  return listArtistProducts(artistId);
}
