import { checkout, getOrder, listOrderItems, listByBuyer, updateStatus, listStatuses } from './orders.repo.js';
import { getArtistOrder, listArtistOrders } from './artists.repo.js';
import { ok, list } from '../utils/http.js';
import { requireEnum, requireInt, requireString, optionalString } from '../utils/validate.js';

const PAYMENT_METHODS = ['card', 'sbp'];

export async function createOrder(req, res) {
  const shippingAddress = requireString(req.body?.shippingAddress, 'shippingAddress', { max: 500 });
  const paymentMethod = requireEnum(req.body?.paymentMethod ?? 'card', 'paymentMethod', PAYMENT_METHODS);

  const result = await checkout({ buyerId: req.user.user_id, shippingAddress, paymentMethod });
  if (result.error) return res.status(result.error.status).json({ success: false, error: result.error.message });

  const order = await getOrder(result.orderId);
  const items = await listOrderItems(result.orderId);
  return ok(res, { order, items, payment_method: paymentMethod }, 201);
}

export async function myOrders(req, res) {
  return list(res, await listByBuyer(req.user.user_id));
}

export async function orderDetails(req, res) {
  const orderId = requireInt(req.params.id, 'id');
  const order = await getOrder(orderId);

  if (!order) return res.status(404).json({ success: false, error: 'Заказ не найден' });

  if (order.buyer_id !== req.user.user_id && req.user.role_name !== 'artist' && req.user.role_name !== 'admin') {
    return res.status(403).json({ success: false, error: 'Нет доступа к этому заказу' });
  }

  const items = await listOrderItems(orderId);
  return ok(res, { order, items });
}

export async function statuses(_req, res) {
  return list(res, await listStatuses());
}

export async function artistOrders(req, res) {
  return list(res, await listArtistOrders(req.user.artist_id));
}

export async function setOrderStatus(req, res) {
  const orderId = requireInt(req.params.id, 'id');
  const status = requireString(req.body?.status, 'status', { max: 50 });
  const trackingNumber = optionalString(req.body?.trackingNumber, 'trackingNumber', { max: 100 });

  const owned = await getArtistOrder(orderId, req.user.artist_id);
  if (!owned) return res.status(404).json({ success: false, error: 'Заказ не найден или не относится к вашему магазину' });

  const allowed = await listStatuses();
  if (!allowed.some((st) => st.status_name === status)) {
    return res.status(400).json({ success: false, error: `Неизвестный статус. Доступно: ${allowed.map((st) => st.status_name).join(', ')}` });
  }

  const order = await updateStatus(orderId, status, trackingNumber);
  return ok(res, order);
}
