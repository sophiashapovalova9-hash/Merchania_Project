import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MOCK_DB = 'true';
process.env.PORT = '0';
process.env.DEMO_USER_ID = '1';
process.env.CORS_ORIGIN = '*';

const { createApp } = await import('../src/app.js');

const app = createApp();
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const port = server.address().port;

const BUYER = { 'x-user-id': '1' };
const ARTIST = { 'x-user-id': '2' };

async function api(method, path, { body, headers = BUYER } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

test('health: мок-режим отвечает', async () => {
  const { status, body } = await api('GET', '/api/health', { headers: {} });
  assert.equal(status, 200);
  assert.equal(body.db.connected, true);
  assert.equal(body.db.mode, 'mock');
});

test('каталог: список, пагинация и total', async () => {
  const { status, body } = await api('GET', '/api/products?limit=3', { headers: {} });
  assert.equal(status, 200);
  assert.equal(body.meta.total, 9, 'в сиде 9 товаров');
  assert.equal(body.data.length, 3);
  assert.equal(body.meta.pages, 3);
  assert.ok(body.data[0].title, 'в карточке есть название');
  assert.ok(body.data[0].shop_name, 'в карточке есть магазин');
});

test('каталог: фильтр по фандому', async () => {
  const { body } = await api('GET', '/api/products?fandomId=1&limit=48', { headers: {} });
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((p) => p.fandom_name === 'Genshin Impact'));
});

test('карточка товара: описание, фото, отзывы и рейтинг', async () => {
  const { status, body } = await api('GET', '/api/products/1', { headers: {} });
  assert.equal(status, 200);
  assert.equal(body.data.product_id, 1);
  assert.ok(body.data.description);
  assert.equal(body.data.images.length, 1);
  assert.equal(body.data.review_count, 2);
  assert.equal(body.data.avg_rating, 4.5);
});

test('карточка товара: 404 для несуществующего', async () => {
  const { status } = await api('GET', '/api/products/9999', { headers: {} });
  assert.equal(status, 404);
});

test('валидация: limit=0 -> 400', async () => {
  const { status, body } = await api('GET', '/api/products?limit=0', { headers: {} });
  assert.equal(status, 400);
  assert.match(body.error, /limit/);
});

test('корзина: две позиции из сида и итог', async () => {
  const { status, body } = await api('GET', '/api/cart');
  assert.equal(status, 200);
  assert.equal(body.data.items.length, 2);
  assert.equal(body.data.items_count, 2);
  assert.equal(body.data.subtotal, 1000);
  assert.equal(body.data.shipping, 350);
  assert.equal(body.data.total, 1350);
  assert.equal(body.data.to_free_shipping, 1000);
});

test('корзина: добавление товара', async () => {
  const { status, body } = await api('POST', '/api/cart', { body: { productId: 3, quantity: 1 } });
  assert.equal(status, 201);
  assert.equal(body.data.items.length, 3);
  assert.equal(body.data.subtotal, 1400);
});

test('корзина: нельзя положить больше, чем есть на складе', async () => {

  const { status, body } = await api('PATCH', '/api/cart/3', { body: { quantity: 50 } });
  assert.equal(status, 409);
  assert.match(body.error, /остатка/);
});

test('корзина: quantity больше 99 отклоняется валидацией', async () => {
  const { status, body } = await api('PATCH', '/api/cart/3', { body: { quantity: 999 } });
  assert.equal(status, 400);
  assert.match(body.error, /quantity/);
});

test('корзина: изменение количества пересчитывает итог', async () => {
  const { body } = await api('PATCH', '/api/cart/3', { body: { quantity: 2 } });
  assert.equal(body.data.subtotal, 1800);
  assert.equal(body.data.shipping, 350);
  assert.equal(body.data.to_free_shipping, 200);
});

test('корзина: удаление позиции', async () => {
  const { body } = await api('DELETE', '/api/cart/3');
  assert.equal(body.data.items.length, 2);
  assert.equal(body.data.subtotal, 1000);
});

test('чекаут: пустой адрес -> 400', async () => {
  const { status } = await api('POST', '/api/orders/checkout', { body: { shippingAddress: '' } });
  assert.equal(status, 400);
});

test('чекаут: заказ создаётся, остатки списываются, корзина чистится', async () => {
  const before = await api('GET', '/api/products/1', { headers: {} });
  const stockBefore = before.body.data.stock;

  const { status, body } = await api('POST', '/api/orders/checkout', {
    body: { shippingAddress: 'Москва, ул. Творческая, 42', paymentMethod: 'card' },
  });
  assert.equal(status, 201);
  assert.equal(body.data.order.total_amount, 1000);
  assert.equal(body.data.order.status_name, 'Новый');
  assert.equal(body.data.items.length, 2);

  const after = await api('GET', '/api/products/1', { headers: {} });
  assert.equal(after.body.data.stock, stockBefore - 1, 'остаток уменьшился на 1');

  const cart = await api('GET', '/api/cart');
  assert.equal(cart.body.data.items.length, 0, 'корзина очищена');
});

test('история заказов: созданный заказ виден покупателю', async () => {
  const { body } = await api('GET', '/api/orders');
  assert.ok(body.data.length >= 1);
  assert.ok(body.data.some((o) => o.status_name === 'Новый'));
});

test('личный кабинет: профиль и его обновление', async () => {
  const me = await api('GET', '/api/account/me');
  assert.equal(me.body.data.email, 'ivan@example.com');
  assert.equal(me.body.data.role_name, 'buyer');

  const patch = await api('PATCH', '/api/account/profile', {
    body: { firstName: 'Иван', lastName: 'Петров', phone: '+7 900 000-00-00' },
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.data.last_name, 'Петров');
});

test('избранное: сердечко работает как переключатель', async () => {
  const add = await api('POST', '/api/account/wishlist/2');
  assert.equal(add.body.data.inWishlist, true);
  assert.equal(add.body.data.items.length, 1);

  const remove = await api('POST', '/api/account/wishlist/2');
  assert.equal(remove.body.data.inWishlist, false);
  assert.equal(remove.body.data.items.length, 0);
});

test('поддержка: заявка создаётся и возвращается списком', async () => {
  const create = await api('POST', '/api/support/tickets', {
    body: { subject: 'Где мой заказ?', message: 'Трекинг не обновляется три дня.' },
  });
  assert.equal(create.status, 201);
  assert.equal(create.body.data.length, 1);

  const list = await api('GET', '/api/support/tickets');
  assert.equal(list.body.data[0].subject, 'Где мой заказ?');
  assert.equal(list.body.data[0].is_resolved, false);
});

test('доступ: покупатель не попадает в панель художника', async () => {
  const { status, body } = await api('GET', '/api/artist/analytics');
  assert.equal(status, 403);
  assert.match(body.error, /художник/i);
});

test('панель художника: аналитика и топ товаров', async () => {
  const { status, body } = await api('GET', '/api/artist/analytics', { headers: ARTIST });
  assert.equal(status, 200);
  assert.equal(body.data.artist.shop_name, 'Studio_Pan');
  assert.equal(typeof body.data.income_total, 'number');
  assert.ok(Array.isArray(body.data.top_products));
});

test('панель художника: CRUD товара', async () => {
  const create = await api('POST', '/api/artist/products', {
    headers: ARTIST,
    body: { categoryId: 1, fandomId: 3, title: 'Значок "Денджи"', price: 320, stock: 10 },
  });
  assert.equal(create.status, 201);
  const created = create.body.data.find((p) => p.title === 'Значок "Денджи"');
  assert.ok(created, 'новый товар в списке');

  const update = await api('PUT', `/api/artist/products/${created.product_id}`, {
    headers: ARTIST,
    body: { categoryId: 1, fandomId: 3, title: 'Значок "Денджи" v2', price: 340, stock: 8 },
  });
  const updated = update.body.data.find((p) => p.product_id === created.product_id);
  assert.equal(updated.title, 'Значок "Денджи" v2');
  assert.equal(Number(updated.price), 340);

  const stock = await api('PATCH', `/api/artist/products/${created.product_id}/stock`, { headers: ARTIST, body: { stock: 3 } });
  assert.equal(stock.body.data.find((p) => p.product_id === created.product_id).stock, 3);
});

test('панель художника: заказ и смена статуса', async () => {
  const orders = await api('GET', '/api/artist/orders', { headers: ARTIST });
  assert.ok(orders.body.data.length >= 1);
  const orderId = orders.body.data[0].order_id;

  const patch = await api('PATCH', `/api/artist/orders/${orderId}/status`, {
    headers: ARTIST,
    body: { status: 'Сборка', trackingNumber: 'BB-999-000' },
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.data.status_name, 'Сборка');
  assert.equal(patch.body.data.tracking_number, 'BB-999-000');

  const bad = await api('PATCH', `/api/artist/orders/${orderId}/status`, { headers: ARTIST, body: { status: 'В дороге' } });
  assert.equal(bad.status, 400);
});

test('404 для неизвестного маршрута', async () => {
  const { status } = await api('GET', '/api/nope', { headers: {} });
  assert.equal(status, 404);
});

test('фото товара отдаётся картинкой', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/products/1/image`);
  const buf = Buffer.from(await res.arrayBuffer());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.ok(buf.length > 1000);
});

test.after(() => server.close());
