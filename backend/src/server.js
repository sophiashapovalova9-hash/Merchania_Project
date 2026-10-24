import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './db/index.js';
import { prepareDatabase } from './db/prepare.js';

async function main() {

  try {
    const db = await connectDb();
    console.log(`[db] подключение установлено: ${JSON.stringify(db.describe())}`);
    if (!env.mockDb) await prepareDatabase();
  } catch (err) {
    console.error(`[db] не удалось подключиться к Supabase: ${err.message}`);
    console.error('[db] сервер продолжит работу, но запросы к данным будут падать. Проверь DATABASE_URL в backend/.env');
  }

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[api] Merchania API слушает http://0.0.0.0:${env.port} (режим: ${env.mockDb ? 'MOCK' : 'Supabase'})`);
  });
}

main();
