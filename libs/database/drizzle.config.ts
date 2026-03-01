import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'oksai',
    password: process.env.DB_PASSWORD || 'oksai_dev_password',
    database: process.env.DB_NAME || 'oksai',
  },
  verbose: true,
  strict: true,
});
