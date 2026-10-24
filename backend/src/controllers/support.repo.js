import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

export async function createTicket(userId, { subject, message }) {
  await getDb().query(
    `
    INSERT INTO SupportTicket (UserID, Subject, Message)
    VALUES (@userId, @subject, @message);`,
    { userId: q.int(userId), subject: q.text(subject, 200), message: q.text(message, 4000) },
  );
  return listTickets(userId);
}

export async function listTickets(userId = null) {
  const inputs = {};
  let where = '';
  if (userId != null) {
    where = '\n    WHERE t.UserID = @userId';
    inputs.userId = q.int(userId);
  }

  const { rows } = await getDb().query(
    `
    SELECT t.TicketID AS ticket_id, t.Subject AS subject, t.Message AS message,
           t.IsResolved AS is_resolved, t.CreatedAt AS created_at,
           t.UserID AS user_id
    FROM SupportTicket t${where}
    ORDER BY t.CreatedAt DESC;`,
    inputs,
  );
  return rows;
}

export async function resolveTicket(ticketId, isResolved = true) {
  await getDb().query('UPDATE SupportTicket SET IsResolved = @isResolved WHERE TicketID = @ticketId;', {
    ticketId: q.int(ticketId),
    isResolved: q.bool(isResolved),
  });
  return listTickets();
}

export async function listWishlist(userId) {
  const { rows } = await getDb().query(
    `
    SELECT w.WishlistID AS wishlist_id, w.AddedAt AS added_at,
           p.ProductID AS product_id, p.Title AS title, p.Price AS price,
           p.StockQuantity AS stock, a.ShopName AS shop_name,
           f.FandomName AS fandom_name,
           main_img.ImageURL AS image_url
    FROM Wishlist w
    JOIN Product p ON p.ProductID = w.ProductID
    JOIN ArtistDetail a ON a.ArtistID = p.ArtistID
    JOIN Fandom f ON f.FandomID = p.FandomID
    LEFT JOIN LATERAL (
      SELECT m.ImageURL
      FROM ProductMedia m
      WHERE m.ProductID = p.ProductID
      ORDER BY m.IsMain DESC, m.MediaID
      LIMIT 1
    ) main_img ON true
    WHERE w.UserID = @userId
    ORDER BY w.AddedAt DESC;`,
    { userId: q.int(userId) },
  );
  return rows;
}

export async function toggleWishlist(userId, productId) {
  const db = getDb();

  const { rows } = await db.query(
    `
    DELETE FROM Wishlist
    WHERE UserID = @userId AND ProductID = @productId
    RETURNING WishlistID AS wishlist_id;`,
    { userId: q.int(userId), productId: q.int(productId) },
  );

  const removed = rows.length > 0;
  if (!removed) {
    await db.query('INSERT INTO Wishlist (UserID, ProductID) VALUES (@userId, @productId);', {
      userId: q.int(userId),
      productId: q.int(productId),
    });
  }

  return { inWishlist: !removed, items: await listWishlist(userId) };
}
