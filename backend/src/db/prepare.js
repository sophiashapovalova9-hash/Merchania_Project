import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { getDb } from './index.js';
import { ensureProductImages } from './images.js';

const sqlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../sql/supabase.sql');

let pending = null;

async function productCount() {
  const { rows } = await getDb().query('SELECT COUNT(*) AS total FROM Product');
  return Number(rows[0]?.total ?? 0);
}

async function seedIfEmpty() {
  try {
    if (await productCount() > 0) return 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  await getDb().script(readFileSync(sqlPath, 'utf8'));
  return productCount();
}

async function run() {
  const products = await seedIfEmpty();
  const images = await ensureProductImages();
  console.log(`[db] тестовые товары: ${products || 'уже были'}, фото дописано: ${images}`);
}

export function prepareDatabase() {
  if (env.mockDb) return Promise.resolve();
  if (!pending) {
    pending = run().catch((err) => {
      pending = null;
      console.error('[db] не удалось подготовить Supabase. Вставь backend/sql/supabase.sql в SQL Editor и запусти ещё раз.');
      console.error(`[db] ${err.message}`);
      throw err;
    });
  }
  return pending;
}
