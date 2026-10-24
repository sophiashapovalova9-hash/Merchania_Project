const KEY = 'merchania.userId';

export const DEMO_USERS = [
  { id: 1, email: 'ivan@example.com', password: 'demo', who: 'покупатель Иван' },
  { id: 2, email: 'studio.pan@example.com', password: 'demo', who: 'художник Studio_Pan' },
  { id: 3, email: 'neon.brush@example.com', password: 'demo', who: 'художник NeonBrush' },
];

export function getUserId() {
  return localStorage.getItem(KEY) || '1';
}

export function setUserId(id) {
  localStorage.setItem(KEY, String(id));
  window.dispatchEvent(new Event('merchania-user'));
}

export function logout() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('merchania-user'));
}

export function rub(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)} ₽`;
}

export function productImage(item) {
  const id = item?.product_id;
  return id ? `/api/products/${id}/image?v=3` : '';
}

export function when(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Бэкенд не запущен. В другом окне PowerShell: cd backend и npm run dev');
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Ошибка ${res.status}`);
  }
  if (method !== 'GET' && path.startsWith('/cart')) {
    window.dispatchEvent(new Event('merchania-cart'));
  }
  return json;
}

const data = (path, opts) => request(path, opts).then((json) => json.data);

export const api = {
  me: () => data('/account/me'),
  products: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    const tail = query.toString();
    return request(`/products${tail ? `?${tail}` : ''}`);
  },
  fandoms: () => data('/products/meta/fandoms'),
  categories: () => data('/products/meta/categories'),
  product: (id) => data(`/products/${id}`),
  cart: () => data('/cart'),
  addToCart: (productId, quantity = 1) => data('/cart', { method: 'POST', body: { productId, quantity } }),
  setQuantity: (productId, quantity) => data(`/cart/${productId}`, { method: 'PATCH', body: { quantity } }),
  removeFromCart: (productId) => data(`/cart/${productId}`, { method: 'DELETE' }),
  checkout: (shippingAddress, paymentMethod = 'card') =>
    data('/orders/checkout', { method: 'POST', body: { shippingAddress, paymentMethod } }),
  orders: () => data('/orders'),
  saveProfile: (body) => data('/account/profile', { method: 'PATCH', body }),
  wishlist: () => data('/account/wishlist'),
  toggleWish: (productId) => data(`/account/wishlist/${productId}`, { method: 'POST', body: {} }),
  createTicket: (subject, message) => data('/support/tickets', { method: 'POST', body: { subject, message } }),
  myTickets: () => data('/support/tickets'),
  analytics: () => data('/artist/analytics'),
  artistProducts: () => data('/artist/products'),
  artistOrders: () => data('/artist/orders'),
  createProduct: (body) => data('/artist/products', { method: 'POST', body }),
  setStock: (id, stock) => data(`/artist/products/${id}/stock`, { method: 'PATCH', body: { stock } }),
  setOrderStatus: (id, status, trackingNumber) =>
    data(`/artist/orders/${id}/status`, { method: 'PATCH', body: { status, trackingNumber } }),
  statuses: () => data('/orders/meta/statuses'),
  uploadImage: (id, imageBase64, mimeType) =>
    data(`/artist/products/${id}/image`, { method: 'POST', body: { imageBase64, mimeType } }),
};
