import pg from 'pg';
import { env } from '../config/env.js';
import { createMockDb } from './mock.js';

const { Pool, types } = pg;

types.setTypeParser(20, (value) => (value == null ? null : Number(value)));
types.setTypeParser(1700, (value) => (value == null ? null : Number(value)));

let instance = null;

export function getDb() {
  if (!instance) instance = env.mockDb ? createMockDb() : createPgDb();
  return instance;
}

export async function connectDb() {
  const db = getDb();
  await db.ping();
  return db;
}

function bind(text, inputs = {}) {
  const values = [];
  const sql = text.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(inputs, name)) {
      throw new Error(`Нет параметра @${name}`);
    }
    values.push(inputs[name].value);
    return `$${values.length}`;
  });
  return { sql, values };
}

function run(client, text, inputs = {}) {
  const { sql, values } = bind(text, inputs);
  const result = values.length ? client.query(sql, values) : client.query(sql);
  return result.then((queryResult) => ({
    rows: queryResult.rows ?? [],
    total: queryResult.rowCount ?? queryResult.rows?.length ?? 0,
  }));
}

function safeTarget(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return { host: '', port: '', database: '' };
  }
}

function createPgDb() {
  let poolPromise = null;

  const pool = () => {
    if (!poolPromise) {
      if (!env.databaseUrl) {
        poolPromise = Promise.reject(new Error('DATABASE_URL пустой. Впиши строку подключения Supabase в backend/.env'));
        poolPromise.catch(() => {
          poolPromise = null;
        });
        return poolPromise;
      }
      const ssl = /sslmode=disable/i.test(env.databaseUrl) ? false : { rejectUnauthorized: false };
      const next = new Pool({
        connectionString: env.databaseUrl,
        ssl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 20_000,
      });
      poolPromise = next.connect()
        .then((client) => {
          client.release();
          return next;
        })
        .catch((err) => {
          poolPromise = null;
          throw err;
        });
    }
    return poolPromise;
  };

  return {
    async query(text, inputs = {}) {
      return run(await pool(), text, inputs);
    },

    async script(text) {
      const client = await (await pool()).connect();
      const body = text.replace(/^\uFEFF/, '').replace(/^\s*begin\s*;/i, '').replace(/commit\s*;\s*$/i, '');
      try {
        await client.query('BEGIN');
        await client.query(body);
        await client.query('COMMIT');
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // уже закрыта
        }
        throw err;
      } finally {
        client.release();
      }
    },

    async transaction(fn) {
      const client = await (await pool()).connect();
      try {
        await client.query('BEGIN');
        const value = await fn({
          query: (text, inputs = {}) => run(client, text, inputs),
          commit: async () => {},
          rollback: async () => {
            throw new Error('rollback');
          },
        });
        await client.query('COMMIT');
        return value;
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // уже закрыта
        }
        throw err;
      } finally {
        client.release();
      }
    },

    async ping() {
      const { rows } = await this.query('SELECT 1 AS ok');
      return Number(rows[0]?.ok) === 1;
    },

    describe() {
      return { mode: 'supabase', ...safeTarget(env.databaseUrl) };
    },
  };
}
