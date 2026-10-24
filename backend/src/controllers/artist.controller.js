import {
  getArtist,
  getAnalytics,
  getTopProducts,
  listArtistProducts,
  createArtistProduct,
  updateArtistProduct,
  setStock,
} from './artists.repo.js';
import { saveArtistImage } from '../db/images.js';
import { ok, list } from '../utils/http.js';
import { requireInt, requireMoney, requireString, optionalString } from '../utils/validate.js';

export async function analytics(req, res) {
  const artistId = req.user.artist_id;
  const [summary, top, artist] = await Promise.all([
    getAnalytics(artistId),
    getTopProducts(artistId, 5),
    getArtist(artistId),
  ]);

  return ok(res, {
    artist: { artist_id: artist.artist_id, shop_name: artist.shop_name, rating: artist.rating },
    income_total: Number(summary.income_total),
    orders_total: summary.orders_total,
    avg_check: Number(summary.avg_check),
    units_sold: summary.units_sold,
    stock_total: summary.stock_total,
    top_products: top.map((t) => ({ ...t, revenue: Number(t.revenue) })),
  });
}

export async function products(req, res) {
  return list(res, await listArtistProducts(req.user.artist_id));
}

export async function createProduct(req, res) {
  const data = {
    categoryId: requireInt(req.body?.categoryId, 'categoryId'),
    fandomId: requireInt(req.body?.fandomId, 'fandomId'),
    title: requireString(req.body?.title, 'title', { max: 200 }),
    description: optionalString(req.body?.description, 'description', { max: 4000 }),
    price: requireMoney(req.body?.price, 'price'),
    stock: requireInt(req.body?.stock ?? 0, 'stock', { min: 0, max: 100000 }),
  };

  return ok(res, await createArtistProduct(req.user.artist_id, data), 201);
}

export async function updateProduct(req, res) {
  const productId = requireInt(req.params.id, 'id');
  const data = {
    categoryId: requireInt(req.body?.categoryId, 'categoryId'),
    fandomId: requireInt(req.body?.fandomId, 'fandomId'),
    title: requireString(req.body?.title, 'title', { max: 200 }),
    description: optionalString(req.body?.description, 'description', { max: 4000 }),
    price: requireMoney(req.body?.price, 'price'),
    stock: requireInt(req.body?.stock ?? 0, 'stock', { min: 0, max: 100000 }),
  };

  return ok(res, await updateArtistProduct(req.user.artist_id, productId, data));
}

export async function uploadProductImage(req, res) {
  const productId = requireInt(req.params.id, 'id');
  const raw = requireString(req.body?.imageBase64, 'imageBase64', { max: 4_000_000 });
  const mime = optionalString(req.body?.mimeType, 'mimeType', { max: 40 }) || 'image/png';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
    return res.status(400).json({ success: false, error: 'Нужна картинка PNG, JPEG или WEBP' });
  }
  const buffer = Buffer.from(raw.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  if (!buffer.length || buffer.length > 2_000_000) {
    return res.status(400).json({ success: false, error: 'Файл пустой или больше 2 МБ' });
  }
  const saved = await saveArtistImage(req.user.artist_id, productId, buffer, mime);
  if (!saved) return res.status(404).json({ success: false, error: 'Товар не найден в вашем магазине' });
  return ok(res, saved);
}

export async function changeStock(req, res) {
  const productId = requireInt(req.params.id, 'id');
  const stock = requireInt(req.body?.stock, 'stock', { min: 0, max: 100000 });
  return ok(res, await setStock(req.user.artist_id, productId, stock));
}
