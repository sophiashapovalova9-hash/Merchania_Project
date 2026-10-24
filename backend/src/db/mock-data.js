export const seed = {
  roles: [
    { role_id: 1, role_name: 'buyer' },
    { role_id: 2, role_name: 'artist' },
    { role_id: 3, role_name: 'admin' },
  ],

  orderStatuses: [
    { status_id: 1, status_name: 'Новый' },
    { status_id: 2, status_name: 'Сборка' },
    { status_id: 3, status_name: 'Отправлен' },
    { status_id: 4, status_name: 'Доставлен' },
    { status_id: 5, status_name: 'Завершён' },
    { status_id: 6, status_name: 'Отменён' },
  ],

  users: [
    { user_id: 1, email: 'ivan@example.com', role_id: 1, role_name: 'buyer', created_at: '2024-05-01T10:00:00' },
    { user_id: 2, email: 'studio.pan@example.com', role_id: 2, role_name: 'artist', created_at: '2024-04-12T10:00:00' },
    { user_id: 3, email: 'neon.brush@example.com', role_id: 3, role_name: 'artist', created_at: '2024-06-02T10:00:00' },
  ],

  profiles: [
    { profile_id: 1, user_id: 1, first_name: 'Иван', last_name: 'Иванов', patronymic: null, phone: '+7 999 000-00-00' },
    { profile_id: 2, user_id: 2, first_name: 'Пан', last_name: 'Студиев', patronymic: null, phone: null },
    { profile_id: 3, user_id: 3, first_name: 'Неон', last_name: 'Брашев', patronymic: null, phone: null },
  ],

  artists: [
    { artist_id: 1, user_id: 2, shop_name: 'Studio_Pan', bio: 'Акрил, значки и стикеры по мотивам аниме-игр.', rating: 4.9 },
    { artist_id: 2, user_id: 3, shop_name: 'NeonBrush', bio: 'Постеры и prints, малые тиражи.', rating: 4.7 },
  ],

  fandoms: [
    { fandom_id: 1, fandom_name: 'Genshin Impact', description: null },
    { fandom_id: 2, fandom_name: 'Honkai: Star Rail', description: null },
    { fandom_id: 3, fandom_name: 'Chainsaw Man', description: null },
    { fandom_id: 4, fandom_name: 'Jujutsu Kaisen', description: null },
  ],

  categories: [
    { category_id: 1, category_name: 'Значки' },
    { category_id: 2, category_name: 'Стикеры' },
    { category_id: 3, category_name: 'Акриловые стенды' },
    { category_id: 4, category_name: 'Постеры' },
    { category_id: 5, category_name: 'Брелоки' },
  ],

  products: [
    { product_id: 1, artist_id: 1, category_id: 3, fandom_id: 1, title: 'Акриловый стенд "Странник"', description: 'Двусторонняя печать, высота 15 см, защитная плёнка.', price: 750, stock: 12, created_at: '2024-05-10T10:00:00' },
    { product_id: 2, artist_id: 1, category_id: 1, fandom_id: 1, title: 'Значок "Паймон"', description: 'Металл, эмаль, 3 см.', price: 250, stock: 40, created_at: '2024-05-11T10:00:00' },
    { product_id: 3, artist_id: 1, category_id: 2, fandom_id: 2, title: 'Стикерпак "Звёздный экспресс"', description: '6 виниловых стикеров, влагостойкие.', price: 400, stock: 25, created_at: '2024-05-12T10:00:00' },
    { product_id: 4, artist_id: 1, category_id: 5, fandom_id: 3, title: 'Брелок "Аки"', description: 'Акрил, двусторонний, 6 см.', price: 300, stock: 18, created_at: '2024-05-13T10:00:00' },
    { product_id: 5, artist_id: 1, category_id: 3, fandom_id: 4, title: 'Акриловый стенд "Годжо"', description: 'Двусторонняя печать, высота 20 см.', price: 900, stock: 7, created_at: '2024-05-14T10:00:00' },
    { product_id: 6, artist_id: 1, category_id: 1, fandom_id: 2, title: 'Значок "Март 7"', description: 'Металл, эмаль, 3.5 см.', price: 280, stock: 0, created_at: '2024-05-15T10:00:00' },
    { product_id: 7, artist_id: 2, category_id: 4, fandom_id: 3, title: 'Постер "Денджи" A3', description: 'Плотная бумага 250 г/м², без рамки.', price: 550, stock: 15, created_at: '2024-05-16T10:00:00' },
    { product_id: 8, artist_id: 2, category_id: 4, fandom_id: 1, title: 'Постер "Ли Юэ" A2', description: 'Плотная бумага 250 г/м², без рамки.', price: 700, stock: 9, created_at: '2024-05-17T10:00:00' },
    { product_id: 9, artist_id: 2, category_id: 2, fandom_id: 4, title: 'Стикер "Сукуна"', description: 'Винил, 10 см.', price: 180, stock: 60, created_at: '2024-05-18T10:00:00' },
  ],

  media: (ids = []) =>
    ids.map((id) => ({ media_id: id, product_id: id, image_url: `/api/products/${id}/image`, is_main: true })),

  reviews: [
    { review_id: 1, product_id: 1, user_id: 1, rating: 5, comment: 'Отличное качество печати, приехал за 3 дня.', created_at: '2024-05-20T10:00:00' },
    { review_id: 2, product_id: 1, user_id: 2, rating: 4, comment: 'Хороший стенд, плёнка немного пузырилась.', created_at: '2024-05-21T10:00:00' },
  ],

  cart: [
    { cart_item_id: 1, user_id: 1, product_id: 1, quantity: 1 },
    { cart_item_id: 2, user_id: 1, product_id: 2, quantity: 1 },
  ],

  orders: [
    {
      order_id: 1,
      buyer_id: 1,
      status_id: 3,
      order_date: '2024-05-24T10:00:00',
      total_amount: 1850,
      shipping_address: 'Москва, ул. Творческая, 42',
      tracking_number: 'BB-000-111',
    },
  ],

  orderItems: [
    { order_item_id: 1, order_id: 1, product_id: 1, quantity: 2, unit_price: 750 },
    { order_item_id: 2, order_id: 1, product_id: 2, quantity: 1, unit_price: 250 },
  ],

  wishlist: [],
  tickets: [],
};
