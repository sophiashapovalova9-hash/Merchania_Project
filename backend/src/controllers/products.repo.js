import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

const SORTS = {
  newest: 'p.CreatedAt DESC',
  price_asc: 'p.Price ASC, p.ProductID DESC',
  price_desc: 'p.Price DESC, p.ProductID DESC',
  popular: 'sold_qty DESC, p.ProductID DESC',
};

const CARD_COLUMNS = `
    p.ProductID      AS product_id,
    p.Title          AS title,
    p.Price          AS price,
    p.StockQuantity  AS stock,
    p.CreatedAt      AS created_at,
    a.ArtistID       AS artist_id,
    a.ShopName       AS shop_name,
    CAST(a.Rating AS FLOAT) AS rating,
    c.CategoryName   AS category_name,
    f.FandomName     AS fandom_name,
    main_img.ImageURL AS image_url,
    COALESCE(sold.qty, 0) AS sold_qty`;

const CARD_JOINS = `
    JOIN ArtistDetail a ON a.ArtistID = p.ArtistID
    JOIN Category c     ON c.CategoryID = p.CategoryID
    JOIN Fandom f       ON f.FandomID = p.FandomID
    LEFT JOIN ProductMedia main_img ON main_img.MediaID = (
      SELECT MAX(m.MediaID) FROM ProductMedia m WHERE m.ProductID = p.ProductID
    )
    LEFT JOIN LATERAL (
      SELECT SUM(oi.Quantity) AS qty FROM OrderItem oi WHERE oi.ProductID = p.ProductID
    ) sold ON true`;

function buildFilters(filters = {}) {
  const clauses = [];
  const inputs = {};

  if (filters.search) {
    clauses.push(`(p.Title ILIKE @search OR p.Description ILIKE @search OR a.ShopName ILIKE @search OR f.FandomName ILIKE @search)`);
    inputs.search = q.text(`%${filters.search}%`, 220);
  }
  if (filters.fandomId) {
    clauses.push('p.FandomID = @fandomId');
    inputs.fandomId = q.int(filters.fandomId);
  }
  if (filters.categoryId) {
    clauses.push('p.CategoryID = @categoryId');
    inputs.categoryId = q.int(filters.categoryId);
  }
  if (filters.artistId) {
    clauses.push('p.ArtistID = @artistId');
    inputs.artistId = q.int(filters.artistId);
  }
  if (filters.priceMin != null) {
    clauses.push('p.Price >= @priceMin');
    inputs.priceMin = q.money(filters.priceMin);
  }
  if (filters.priceMax != null) {
    clauses.push('p.Price <= @priceMax');
    inputs.priceMax = q.money(filters.priceMax);
  }
  if (filters.inStockOnly) clauses.push('p.StockQuantity > 0');

  return { sql: clauses.length ? `\n      AND ${clauses.join('\n      AND ')}` : '', inputs };
}

export async function findProducts({ search, fandomId, categoryId, artistId, priceMin, priceMax, inStockOnly, sort = 'newest', page = 1, limit = 9 }) {
  const { sql: filterSql, inputs } = buildFilters({ search, fandomId, categoryId, artistId, priceMin, priceMax, inStockOnly });
  const orderBy = SORTS[sort] ?? SORTS.newest;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM Product p
    JOIN ArtistDetail a ON a.ArtistID = p.ArtistID
    JOIN Fandom f ON f.FandomID = p.FandomID
    WHERE 1 = 1${filterSql};`;

  const dataSql = `
    SELECT ${CARD_COLUMNS}
    FROM Product p${CARD_JOINS}
    WHERE 1 = 1${filterSql}
    ORDER BY ${orderBy};`;

  const db = getDb();
  const [countRes, dataRes] = await Promise.all([
    db.query(countSql, inputs),
    db.query(dataSql, inputs),
  ]);

  const start = (page - 1) * limit;
  return {
    rows: dataRes.rows.slice(start, start + limit),
    total: countRes.rows[0]?.total ?? 0,
  };
}

export async function getProductById(productId) {
  const { rows } = await getDb().query(
    `
    SELECT ${CARD_COLUMNS},
           p.Description AS description,
           a.Bio         AS shop_bio
    FROM Product p${CARD_JOINS}
    WHERE p.ProductID = @productId;`,
    { productId: q.int(productId) },
  );
  return rows[0] ?? null;
}

export async function getProductMedia(productId) {
  const { rows } = await getDb().query(
    `
    SELECT m.MediaID AS media_id, m.ImageURL AS image_url, m.IsMain AS is_main
    FROM ProductMedia m
    WHERE m.ProductID = @productId
    ORDER BY m.IsMain DESC, m.MediaID;`,
    { productId: q.int(productId) },
  );
  return rows;
}

export async function getProductReviews(productId) {
  const { rows } = await getDb().query(
    `
    SELECT r.ReviewID AS review_id,
           r.Rating   AS rating,
           r.Comment  AS comment,
           r.CreatedAt AS created_at,
           up.FirstName AS first_name,
           up.LastName  AS last_name
    FROM Review r
    JOIN UserProfile up ON up.UserID = r.UserID
    WHERE r.ProductID = @productId
    ORDER BY r.CreatedAt DESC;`,
    { productId: q.int(productId) },
  );
  return rows;
}

export async function getProductRating(productId) {
  const { rows } = await getDb().query(
    `
    SELECT COUNT(*) AS review_count,
           CAST(AVG(CAST(r.Rating AS FLOAT)) AS FLOAT) AS avg_rating
    FROM Review r
    WHERE r.ProductID = @productId;`,
    { productId: q.int(productId) },
  );
  return rows[0] ?? { review_count: 0, avg_rating: null };
}

export async function listFandoms() {
  const { rows } = await getDb().query(`
    SELECT f.FandomID AS fandom_id, f.FandomName AS fandom_name, COUNT(p.ProductID) AS product_count
    FROM Fandom f
    LEFT JOIN Product p ON p.FandomID = f.FandomID
    GROUP BY f.FandomID, f.FandomName
    ORDER BY product_count DESC, f.FandomName;`);
  return rows;
}

export async function listCategories() {
  const { rows } = await getDb().query(`
    SELECT c.CategoryID AS category_id, c.CategoryName AS category_name, COUNT(p.ProductID) AS product_count
    FROM Category c
    LEFT JOIN Product p ON p.CategoryID = c.CategoryID
    GROUP BY c.CategoryID, c.CategoryName
    ORDER BY product_count DESC, c.CategoryName;`);
  return rows;
}
