import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import winston from 'winston';
import db from './db/index.js';

// Initialize App
const app = express();
const PORT = process.env.PORT || 3000;

// cache setup (stdTTL: 100 seconds)
const myCache = new NodeCache({ 
    stdTTL: 100, 
    checkperiod: 120,
    maxKeys: 500,
    useClones: false 
});

// Logger setup (Winston)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes (configure as needed for prod)
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // HTTP request logger

// Rate Limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting to all requests
// Apply rate limiting to all requests
app.use(limiter);


// Routes
app.get('/', (req: Request, res: Response) => {
  logger.info('Root route accessed');
  res.send('Backend is running securely!');
});

app.get('/health', async (req: Request, res: Response) => {
    try {
        // Simple query to verify DB connection
        const dbTime = await db.query('SELECT NOW()');
        res.json({ 
            status: 'ok', 
            message: 'Server and Database are healthy', 
            timestamp: new Date(),
            dbTime: dbTime.rows[0].now 
        });
    } catch (error) {
        logger.error('Health check failed', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
