export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

export const created = (res, data) => ok(res, data, 201);

export const list = (res, rows, meta = {}) => res.json({ success: true, data: rows, meta });

export const paginated = (res, rows, { total, page, limit }) =>
  list(res, rows, { total, page, limit, pages: limit > 0 ? Math.ceil(total / limit) : 1 });

export const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, error: message, ...(details ? { details } : {}) });
