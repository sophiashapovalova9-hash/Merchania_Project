export const q = {
  int: (value) => ({ type: 'Int', value: toInt(value) }),
  text: (value, size = 200) => ({ type: 'NVarChar', size, value: value == null ? null : String(value) }),
  money: (value) => ({ type: 'Decimal', value: value == null ? null : Number(value) }),
  bool: (value) => ({ type: 'Bit', value: Boolean(value) }),
};

function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    const err = new Error(`Ожидалось число, получено: ${JSON.stringify(value)}`);
    err.status = 400;
    throw err;
  }
  return Math.trunc(n);
}
