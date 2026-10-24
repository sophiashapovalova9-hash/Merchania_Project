import 'dotenv/config';

const bool = (v, def = false) => (v === undefined ? def : String(v).toLowerCase() === 'true');

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  demoUserId: Number(process.env.DEMO_USER_ID ?? 1),
  mockDb: bool(process.env.MOCK_DB),
  databaseUrl: process.env.DATABASE_URL ?? '',
};
