export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export function requireString(value, field, { max = 200 } = {}) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) throw new ValidationError(`Поле "${field}" обязательно`);
  if (v.length > max) throw new ValidationError(`Поле "${field}" длиннее ${max} символов`);
  return v;
}

export function optionalString(value, field, { max = 200 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  return requireString(value, field, { max });
}

export function requireInt(value, field, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new ValidationError(`Поле "${field}" должно быть целым числом`);
  if (n < min || n > max) throw new ValidationError(`Поле "${field}" должно быть в диапазоне ${min}..${max}`);
  return n;
}

export function optionalInt(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return null;
  return requireInt(value, field, opts);
}

export function requireMoney(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`Поле "${field}" должно быть неотрицательным числом`);
  return Math.round(n * 100) / 100;
}

export function requireEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new ValidationError(`Поле "${field}" должно быть одним из: ${allowed.join(', ')}`);
  }
  return value;
}

export function requireEmail(value, field = 'email') {
  const v = requireString(value, field, { max: 100 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError(`Поле "${field}" не похоже на email`);
  return v.toLowerCase();
}
