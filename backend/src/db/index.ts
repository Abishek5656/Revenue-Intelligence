import { Pool } from 'pg';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'db-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Neon DB connection string from .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('DATABASE_URL is not defined in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
      rejectUnauthorized: false
  } // Required for Neon
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('Error executing query', { text, err });
    throw err;
  }
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
};

export default {
  query,
  getClient,
};
