import { ValidationError } from '../utils/validate.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, error: `Маршрут не найден: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ValidationError || err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  const sqlMessages = {
    23505: 'Нарушение уникальности: такая запись уже есть',
    23503: 'Операция запрещена: запись связана с другими данными',
    23502: 'Не заполнено обязательное поле',
    22001: 'Слишком длинное значение для поля',
  };

  const status = err.status ?? (sqlMessages[err.code] ? 409 : 500);
  const dbDown = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|password authentication|DATABASE_URL|getaddrinfo|no pg_hba|SSL|certificate/i.test(err.message || '');
  const message = sqlMessages[err.code]
    ?? (dbDown
      ? 'Не удалось подключиться к Supabase. Проверь DATABASE_URL в backend/.env: Session pooler, порт 5432, проект не на паузе.'
      : (status === 500 ? `Внутренняя ошибка сервера: ${err.message}` : err.message));

  console.error(`[error] ${req.method} ${req.originalUrl}`, {
    name: err.name,
    number: err.number,
    message: err.message,
  });

  return res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && status === 500 ? { debug: err.message } : {}),
  });
}
