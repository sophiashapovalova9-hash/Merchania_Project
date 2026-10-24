import { listCart, getCartSummary, addItem, setQuantity, removeItem } from './cart.repo.js';
import { ok } from '../utils/http.js';
import { requireInt } from '../utils/validate.js';

const FREE_SHIPPING_FROM = 2000;
const SHIPPING_COST = 350;

function totals(subtotal) {
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    free_shipping_from: FREE_SHIPPING_FROM,
    to_free_shipping: Math.max(0, FREE_SHIPPING_FROM - subtotal),
  };
}

export async function getCart(req, res) {
  const items = await listCart(req.user.user_id);
  const { subtotal, items_count } = await getCartSummary(req.user.user_id);
  return ok(res, { items, items_count, ...totals(Number(subtotal)) });
}

export async function addToCart(req, res) {
  const productId = requireInt(req.body?.productId, 'productId');
  const quantity = requireInt(req.body?.quantity ?? 1, 'quantity', { min: 1, max: 99 });

  const result = await addItem(req.user.user_id, productId, quantity);
  if (result.error) return res.status(result.error.status).json({ success: false, error: result.error.message });

  const { subtotal, items_count } = await getCartSummary(req.user.user_id);
  return ok(res, { items: result.items, items_count, ...totals(Number(subtotal)) }, 201);
}

export async function updateCartItem(req, res) {
  const productId = requireInt(req.params.productId, 'productId');
  const quantity = requireInt(req.body?.quantity, 'quantity', { min: 1, max: 99 });

  const result = await setQuantity(req.user.user_id, productId, quantity);
  if (result.error) return res.status(result.error.status).json({ success: false, error: result.error.message });

  const { subtotal, items_count } = await getCartSummary(req.user.user_id);
  return ok(res, { items: result.items, items_count, ...totals(Number(subtotal)) });
}

export async function removeFromCart(req, res) {
  const productId = requireInt(req.params.productId, 'productId');
  const { items } = await removeItem(req.user.user_id, productId);
  const { subtotal, items_count } = await getCartSummary(req.user.user_id);
  return ok(res, { items, items_count, ...totals(Number(subtotal)) });
}
