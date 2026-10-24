import { findProducts, getProductById, getProductMedia, getProductReviews, getProductRating, listFandoms, listCategories } from './products.repo.js';
import { readProductImage } from '../db/images.js';
import { prepareDatabase } from '../db/prepare.js';
import { ok, paginated, list } from '../utils/http.js';
import { optionalInt, optionalString, requireEnum, requireInt } from '../utils/validate.js';

const SORTS = ['newest', 'price_asc', 'price_desc', 'popular'];

export async function listProducts(req, res) {
  try {
    await prepareDatabase();
  } catch (err) {
    console.error(`[db] подготовка каталога: ${err.message}`);
  }
  const params = {
    search: optionalString(req.query.search, 'search', { max: 100 }),
    fandomId: optionalInt(req.query.fandomId, 'fandomId'),
    categoryId: optionalInt(req.query.categoryId, 'categoryId'),
    artistId: optionalInt(req.query.artistId, 'artistId'),
    priceMin: optionalInt(req.query.priceMin, 'priceMin', { min: 0 }),
    priceMax: optionalInt(req.query.priceMax, 'priceMax', { min: 0 }),
    inStockOnly: req.query.inStockOnly === 'true',
    sort: requireEnum(req.query.sort ?? 'newest', 'sort', SORTS),
    page: requireInt(req.query.page ?? 1, 'page', { min: 1 }),
    limit: requireInt(req.query.limit ?? 9, 'limit', { min: 1, max: 48 }),
  };

  if (params.priceMin != null && params.priceMax != null && params.priceMin > params.priceMax) {
    return res.status(400).json({ success: false, error: 'priceMin не может быть больше priceMax' });
  }

  const { rows, total } = await findProducts(params);
  return paginated(res, rows, { total, page: params.page, limit: params.limit });
}

export async function productImage(req, res) {
  const productId = requireInt(req.params.id, 'id');
  const image = await readProductImage(productId);
  if (!image) return res.status(404).json({ success: false, error: 'Фото товара не найдено' });
  res.set('Content-Type', image.mime);
  res.set('Cache-Control', 'no-store');
  res.send(image.buffer);
}

export async function getProduct(req, res) {
  const productId = requireInt(req.params.id, 'id');
  const product = await getProductById(productId);
  if (!product) return res.status(404).json({ success: false, error: 'Товар не найден' });

  const [images, reviews, rating] = await Promise.all([
    getProductMedia(productId),
    getProductReviews(productId),
    getProductRating(productId),
  ]);

  return ok(res, { ...product, images, reviews, review_count: rating.review_count, avg_rating: rating.avg_rating });
}

export async function fandoms(_req, res) {
  return list(res, await listFandoms());
}

export async function categories(_req, res) {
  return list(res, await listCategories());
}
