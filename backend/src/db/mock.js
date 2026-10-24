import { seed } from './mock-data.js';

export function createMockDb() {
  let s = clone(seed);
  const seq = { orders: 100, orderItems: 100, tickets: 100, wishlist: 100, products: 100, reviews: 100 };

  const productById = (id) => s.products.find((p) => p.product_id === Number(id));
  const artistById = (id) => s.artists.find((a) => a.artist_id === Number(id));
  const statusById = (id) => s.orderStatuses.find((st) => st.status_id === Number(id));
  const imageOf = (productId) => `/api/products/${productId}/image`;
  const itemsOf = (orderId) => s.orderItems.filter((i) => i.order_id === Number(orderId));
  const cartOf = (userId) => s.cart.filter((c) => c.user_id === Number(userId));
  const productsOf = (artistId) => s.products.filter((p) => p.artist_id === Number(artistId));

  function ordersOfArtist(artistId) {
    const ids = new Set(productsOf(artistId).map((p) => p.product_id));
    const orderIds = new Set(s.orderItems.filter((i) => ids.has(i.product_id)).map((i) => i.order_id));
    return s.orders.filter((o) => orderIds.has(o.order_id));
  }

  function withLookups(p) {
    const artist = artistById(p.artist_id);
    return {
      ...p,
      price: Number(p.price),
      artist_id: p.artist_id,
      shop_name: artist?.shop_name ?? null,
      rating: artist ? Number(artist.rating) : null,
      shop_bio: artist?.bio ?? null,
      category_name: s.categories.find((c) => c.category_id === p.category_id)?.category_name ?? null,
      fandom_name: s.fandoms.find((f) => f.fandom_id === p.fandom_id)?.fandom_name ?? null,
      image_url: imageOf(p.product_id),
      sold_qty: s.orderItems.filter((i) => i.product_id === p.product_id).reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  const orderRow = (o) => ({
    ...o,
    total_amount: Number(o.total_amount),
    status_name: statusById(o.status_id)?.status_name ?? null,
    buyer_email: s.users.find((u) => u.user_id === o.buyer_id)?.email ?? null,
    item_count: itemsOf(o.order_id).reduce((sum, i) => sum + i.quantity, 0),
  });

  const orderItemRow = (i) => ({
    ...i,
    unit_price: Number(i.unit_price),
    line_total: i.quantity * Number(i.unit_price),
    title: productById(i.product_id)?.title ?? null,
    image_url: imageOf(i.product_id),
    shop_name: artistById(productById(i.product_id)?.artist_id)?.shop_name ?? null,
  });

  const cartRow = (c) => {
    const p = productById(c.product_id);
    return {
      cart_item_id: c.cart_item_id,
      quantity: c.quantity,
      product_id: c.product_id,
      title: p?.title ?? null,
      price: p ? Number(p.price) : null,
      stock: p?.stock ?? 0,
      line_total: (p ? Number(p.price) : 0) * c.quantity,
      image_url: imageOf(c.product_id),
      shop_name: artistById(p?.artist_id)?.shop_name ?? null,
    };
  };

  const routes = [

    [/SELECT 1 AS ok/, () => [{ ok: 1 }]],

    [/AS media_id/, (sql, p) => [{ media_id: 1, image_url: imageOf(p.productId), is_main: true }]],
    [/AS review_count/, (sql, p) => {
      const rs = s.reviews.filter((r) => r.product_id === Number(p.productId));
      return [{ review_count: rs.length, avg_rating: rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : null }];
    }],
    [/FROM Review r/, (sql, p) => s.reviews
      .filter((r) => r.product_id === Number(p.productId))
      .map((r) => ({
        ...r,
        first_name: s.profiles.find((x) => x.user_id === r.user_id)?.first_name ?? '',
        last_name: s.profiles.find((x) => x.user_id === r.user_id)?.last_name ?? '',
      }))],
    [/SELECT COUNT\(\*\) AS total/, (sql, p) => [{ total: applyCatalogFilters(p).length }]],
    [/OFFSET @offset ROWS FETCH NEXT @limit/, (sql, p) => applyCatalogFilters(p).map(withLookups).slice(Number(p.offset ?? 0), Number(p.offset ?? 0) + Number(p.limit ?? 9))],
    [/WHERE 1 = 1/, (sql, p) => applyCatalogFilters(p).map(withLookups)],
    [/WHERE p\.ProductID = @productId/, (sql, p) => {
      const prod = productById(p.productId);
      return prod ? [{ ...withLookups(prod), description: prod.description }] : [];
    }],
    [/FROM Fandom f/, () => s.fandoms.map((f) => ({ ...f, product_count: s.products.filter((p) => p.fandom_id === f.fandom_id).length }))],
    [/FROM Category c/, () => s.categories.map((c) => ({ ...c, product_count: s.products.filter((p) => p.category_id === c.category_id).length }))],
    [/FROM Product WHERE ProductID = @productId/, (sql, p) => {
      const prod = productById(p.productId);
      return prod ? [{ stock: prod.stock, title: prod.title }] : [];
    }],
    [/SELECT Quantity AS quantity FROM Cart/, (sql, p) => {
      const row = cartOf(p.userId).find((c) => c.product_id === Number(p.productId));
      return row ? [{ quantity: row.quantity }] : [];
    }],

    [/FROM Cart c WITH \(UPDLOCK\)|FOR UPDATE OF c/, (sql, p) => cartOf(p.buyerId).map((c) => {
      const prod = productById(c.product_id);
      return { product_id: c.product_id, quantity: c.quantity, title: prod?.title ?? null, price: prod ? Number(prod.price) : null, stock: prod?.stock ?? 0 };
    })],
    [/AS cart_item_id/, (sql, p) => cartOf(p.userId).map(cartRow)],
    [/COALESCE\(SUM\(p\.Price \* c\.Quantity\)/, (sql, p) => {
      const items = cartOf(p.userId);
      return [{
        subtotal: items.reduce((sum, c) => sum + (productById(c.product_id)?.price ?? 0) * c.quantity, 0),
        items_count: items.reduce((sum, c) => sum + c.quantity, 0),
      }];
    }],
    [/MERGE Cart AS target|ON CONFLICT \(userid, productid\)/, (sql, p) => {
      const userId = Number(p.userId);
      const productId = Number(p.productId);
      const existing = s.cart.find((c) => c.user_id === userId && c.product_id === productId);
      if (existing) existing.quantity += Number(p.quantity);
      else s.cart.push({ cart_item_id: ++seq.cart, user_id: userId, product_id: productId, quantity: Number(p.quantity) });
      return [];
    }],
    [/UPDATE Cart SET Quantity = @quantity/, (sql, p) => {
      const row = s.cart.find((c) => c.user_id === Number(p.userId) && c.product_id === Number(p.productId));
      if (row) row.quantity = Number(p.quantity);
      return [];
    }],
    [/DELETE FROM Cart WHERE UserID = @userId AND ProductID = @productId/, (sql, p) => {
      s.cart = s.cart.filter((c) => !(c.user_id === Number(p.userId) && c.product_id === Number(p.productId)));
      return [];
    }],
    [/DELETE FROM Cart WHERE UserID = @userId;/, (sql, p) => {
      s.cart = s.cart.filter((c) => c.user_id !== Number(p.userId));
      return [];
    }],
    [/DELETE FROM Cart WHERE UserID = @buyerId/, (sql, p) => {
      s.cart = s.cart.filter((c) => c.user_id !== Number(p.buyerId));
      return [];
    }],
    [/StockQuantity = p\.StockQuantity - c\.Quantity/, (sql, p) => {
      for (const item of cartOf(p.buyerId)) {
        const prod = productById(item.product_id);
        if (prod) prod.stock -= item.quantity;
      }
      return [];
    }],

    [/WHERE o\.BuyerID = @buyerId/, (sql, p) => s.orders.filter((o) => o.buyer_id === Number(p.buyerId)).map(orderRow)],

    [(sql) => sql.includes('SELECT o.OrderID AS order_id')
      && sql.includes('FROM Orders o')
      && sql.includes('WHERE o.OrderID = @orderId')
      && !sql.includes('AND p.ArtistID = @artistId'), (sql, p) => {
      const o = s.orders.find((x) => x.order_id === Number(p.orderId));
      return o ? [orderRow(o)] : [];
    }],
    [/WHERE oi\.OrderID = @orderId/, (sql, p) => itemsOf(p.orderId).map(orderItemRow)],

    [/WHERE o\.OrderID = @orderId AND p\.ArtistID = @artistId/, (sql, p) => {
      const o = s.orders.find((x) => x.order_id === Number(p.orderId));
      if (!o) return [];
      const mine = itemsOf(o.order_id).some((i) => productById(i.product_id)?.artist_id === Number(p.artistId));
      if (!mine) return [];
      const buyer = s.profiles.find((x) => x.user_id === o.buyer_id);
      return [{
        ...o,
        total_amount: Number(o.total_amount),
        status_name: statusById(o.status_id)?.status_name ?? null,
        buyer_first_name: buyer?.first_name ?? null,
        buyer_last_name: buyer?.last_name ?? null,
      }];
    }],

    [/FROM OrderStatus ORDER BY StatusID/, () => s.orderStatuses],
    [/UPDATE o SET o\.StatusID|UPDATE Orders SET StatusID/, (sql, p) => {
      const o = s.orders.find((x) => x.order_id === Number(p.orderId));
      if (o) {
        const next = s.orderStatuses.find((st) => st.status_name === p.statusName);
        if (next) o.status_id = next.status_id;
        if (p.trackingNumber) o.tracking_number = p.trackingNumber;
      }
      return [];
    }],

    [/FROM UserAccount ua/, (sql, p) => {
      const u = s.users.find((x) => x.user_id === Number(p.userId));
      if (!u) return [];
      const prof = s.profiles.find((x) => x.user_id === u.user_id);
      const artist = s.artists.find((a) => a.user_id === u.user_id);
      return [{
        ...u,
        first_name: prof?.first_name ?? null,
        last_name: prof?.last_name ?? null,
        patronymic: prof?.patronymic ?? null,
        phone: prof?.phone ?? null,
        artist_id: artist?.artist_id ?? null,
        shop_name: artist?.shop_name ?? null,
      }];
    }],
    [/UPDATE UserProfile/, (sql, p) => {
      const prof = s.profiles.find((x) => x.user_id === Number(p.userId));
      if (prof) Object.assign(prof, {
        first_name: p.firstName ?? prof.first_name,
        last_name: p.lastName ?? prof.last_name,
        patronymic: p.patronymic ?? prof.patronymic,
        phone: p.phone ?? prof.phone,
      });
      return [];
    }],

    [/FROM ArtistDetail a/, (sql, p) => {
      const a = artistById(p.artistId);
      if (!a) return [];
      const prof = s.profiles.find((x) => x.user_id === a.user_id);
      const orders = ordersOfArtist(a.artist_id);
      const completed = orders.filter((o) => o.status_id === 5);
      return [{
        ...a,
        rating: Number(a.rating),
        email: s.users.find((u) => u.user_id === a.user_id)?.email ?? null,
        first_name: prof?.first_name ?? null,
        last_name: prof?.last_name ?? null,
        product_count: productsOf(a.artist_id).length,
        order_count: orders.length,
        completed_order_count: completed.length,
        income_total: completed.reduce((sum, o) => sum + Number(o.total_amount), 0),
      }];
    }],
    [/AS orders_total/, (sql, p) => {
      const productIds = new Set(productsOf(p.artistId).map((x) => x.product_id));

      const perOrder = new Map();
      for (const i of s.orderItems) {
        if (!productIds.has(i.product_id)) continue;
        const cur = perOrder.get(i.order_id) ?? { units: 0, sum: 0 };
        cur.units += i.quantity;
        cur.sum += i.quantity * Number(i.unit_price);
        perOrder.set(i.order_id, cur);
      }
      const orders = [...perOrder.entries()].map(([orderId, v]) => ({ orderId, ...v, isCompleted: statusById(s.orders.find((o) => o.order_id === orderId)?.status_id)?.status_name === 'Завершён' }));
      const completed = orders.filter((o) => o.isCompleted);

      return [{
        orders_total: orders.length,
        income_total: completed.reduce((sum, o) => sum + o.sum, 0),
        avg_check: completed.length ? Math.round((completed.reduce((sum, o) => sum + o.sum, 0) / completed.length) * 100) / 100 : 0,
        units_sold: orders.reduce((sum, o) => sum + o.units, 0),
        stock_total: productsOf(p.artistId).reduce((sum, x) => sum + x.stock, 0),
      }];
    }],
    [/SELECT TOP \(@top\)\s+oi\.ProductID|LIMIT @top/, (sql, p) => topProducts(Number(p.artistId), Number(p.top ?? 5))],

    [(sql) => sql.includes('p.ArtistID = @artistId') && sql.includes('FROM Product p'), (sql, p) => productsOf(p.artistId).map(withLookups)],

    [(sql) => sql.includes('p.ArtistID = @artistId') && sql.includes('FROM Orders o'), (sql, p) => {
      const orders = ordersOfArtist(p.artistId);
      return orders
        .map((o) => {
          const lines = itemsOf(o.order_id).filter((i) => productById(i.product_id)?.artist_id === Number(p.artistId));
          return {
            order_id: o.order_id,
            order_date: o.order_date,
            status_name: statusById(o.status_id)?.status_name ?? null,
            tracking_number: o.tracking_number ?? null,
            order_total: Number(o.total_amount),
            units: lines.reduce((sum, i) => sum + i.quantity, 0),
            artist_total: lines.reduce((sum, i) => sum + i.quantity * Number(i.unit_price), 0),
            buyer_email: s.users.find((u) => u.user_id === o.buyer_id)?.email ?? null,
          };
        })
        .sort((a, b) => String(b.order_date).localeCompare(String(a.order_date)));
    }],
    [/INSERT INTO Product\s+\(ArtistID/, (sql, p) => {
      s.products.push({
        product_id: ++seq.products,
        artist_id: Number(p.artistId),
        category_id: Number(p.categoryId),
        fandom_id: Number(p.fandomId),
        title: p.title,
        description: p.description ?? null,
        price: Number(p.price),
        stock: Number(p.stock ?? 0),
        created_at: new Date().toISOString(),
      });
      return [];
    }],
    [/UPDATE Product\s+SET Title = @title/, (sql, p) => {
      const prod = productById(p.productId);
      if (prod) Object.assign(prod, {
        title: p.title,
        description: p.description,
        price: Number(p.price),
        stock: Number(p.stock),
        category_id: Number(p.categoryId),
        fandom_id: Number(p.fandomId),
      });
      return [];
    }],
    [/UPDATE Product\s+SET StockQuantity = @stock/, (sql, p) => {
      const prod = productById(p.productId);
      if (prod) prod.stock = Number(p.stock);
      return [];
    }],

    [/DELETE FROM Wishlist/, (sql, p) => {
      const before = s.wishlist.length;
      s.wishlist = s.wishlist.filter((w) => !(w.user_id === Number(p.userId) && w.product_id === Number(p.productId)));
      const deleted = before - s.wishlist.length;

      return Array.from({ length: deleted }, (_, i) => ({ wishlist_id: i + 1 }));
    }],
    [/INSERT INTO Wishlist/, (sql, p) => {
      s.wishlist.push({ wishlist_id: ++seq.wishlist, user_id: Number(p.userId), product_id: Number(p.productId), added_at: new Date().toISOString() });
      return [];
    }],
    [/SELECT w\.WishlistID/, (sql, p) => s.wishlist
      .filter((w) => w.user_id === Number(p.userId))
      .map((w) => ({ ...withLookups(productById(w.product_id)), wishlist_id: w.wishlist_id, added_at: w.added_at }))],

    [/INSERT INTO SupportTicket/, (sql, p) => {
      s.tickets.push({
        ticket_id: ++seq.tickets,
        user_id: Number(p.userId),
        subject: p.subject,
        message: p.message,
        is_resolved: false,
        created_at: new Date().toISOString(),
      });
      return [];
    }],
    [/UPDATE SupportTicket/, (sql, p) => {
      const t = s.tickets.find((x) => x.ticket_id === Number(p.ticketId));
      if (t) t.is_resolved = Boolean(p.isResolved);
      return [];
    }],
    [/FROM SupportTicket t/, (sql, p) => s.tickets
      .filter((t) => (p.userId == null ? true : t.user_id === Number(p.userId)))
      .map((t) => ({ ...t, first_name: s.profiles.find((x) => x.user_id === t.user_id)?.first_name ?? '' }))],
  ];

  function applyCatalogFilters(p) {
    let rows = [...s.products];
    if (p.artistId != null) rows = rows.filter((r) => r.artist_id === Number(p.artistId));
    if (p.fandomId != null) rows = rows.filter((r) => r.fandom_id === Number(p.fandomId));
    if (p.categoryId != null) rows = rows.filter((r) => r.category_id === Number(p.categoryId));
    if (p.priceMin != null) rows = rows.filter((r) => r.price >= Number(p.priceMin));
    if (p.priceMax != null) rows = rows.filter((r) => r.price <= Number(p.priceMax));
    if (p.search != null) {
      const needle = String(p.search).replace(/%/g, '').toLowerCase();
      rows = rows.filter((r) => withLookups(r).title.toLowerCase().includes(needle));
    }
    return rows;
  }

  function topProducts(artistId, top) {
    const ids = new Set(productsOf(artistId).map((p) => p.product_id));
    const acc = new Map();
    for (const i of s.orderItems) {
      if (!ids.has(i.product_id)) continue;
      const cur = acc.get(i.product_id) ?? { quantity: 0, revenue: 0 };
      cur.quantity += i.quantity;
      cur.revenue += i.quantity * Number(i.unit_price);
      acc.set(i.product_id, cur);
    }
    return [...acc.entries()]
      .map(([productId, v]) => ({ product_id: productId, title: productById(productId)?.title ?? null, quantity_sold: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, top);
  }

  function dispatch(sqlText, params) {
    const sql = sqlText.replace(/\s+/g, ' ').trim();
    for (const [matcher, handler] of routes) {
      const hit = typeof matcher === 'function' ? matcher(sql) : matcher.test(sql);
      if (hit) return handler(sql, params) ?? [];
    }
    throw new Error(`MOCK_DB: нет обработчика для запроса -> ${sql.slice(0, 140)}...`);
  }

  return {
    async query(sql, inputs = {}) {
      const rows = dispatch(sql, values(inputs));
      return { rows, total: rows.length };
    },

    async transaction(fn) {
      const snapshot = clone(s);
      const handle = {
        query: async (sql, inputs = {}) => {
          const params = values(inputs);
          if (/INSERT INTO Orders/.test(sql)) return createOrderMock(params);
          if (/INSERT INTO OrderItem/.test(sql)) return fillOrderItemsMock(params);
          const rows = dispatch(sql, params);
          return { rows, total: rows.length };
        },
        commit: async () => {},
        rollback: async () => {
          s = snapshot;
        },
      };
      try {
        return await fn(handle);
      } catch (err) {
        s = snapshot;
        throw err;
      }
    },

    async ping() {
      return true;
    },

    describe() {
      return { mode: 'mock', note: 'MOCK_DB=true — данные в памяти, Supabase не используется', products: s.products.length };
    },

    _reset() {
      s = clone(seed);
      seq.orders = 100;
    },
  };

  function createOrderMock(p) {
    const items = cartOf(p.buyerId);
    if (!items.length) return { rows: [], total: 0 };

    for (const item of items) {
      const prod = productById(item.product_id);
      if (prod && prod.stock < item.quantity) {
        const err = new Error(`Недостаточно остатка: "${prod.title}"`);
        err.status = 409;
        throw err;
      }
    }

    const total = items.reduce((sum, i) => sum + productById(i.product_id).price * i.quantity, 0);
    const order = {
      order_id: ++seq.orders,
      buyer_id: Number(p.buyerId),
      status_id: 1,
      order_date: new Date().toISOString(),
      total_amount: total,
      shipping_address: p.shippingAddress,
      tracking_number: null,
    };
    s.orders.push(order);
    return { rows: [{ order_id: order.order_id, total_amount: total }], total: 1 };
  }

  function fillOrderItemsMock(p) {
    const orderId = Number(p.orderId);
    const items = cartOf(p.buyerId);

    for (const item of items) {
      const prod = productById(item.product_id);
      s.orderItems.push({
        order_item_id: ++seq.orderItems,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: prod.price,
      });
    }

    return { rows: [], total: items.length };
  }
}

function values(inputs) {
  const out = {};
  for (const [k, v] of Object.entries(inputs)) out[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
  return out;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
