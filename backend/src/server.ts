import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import winston from 'winston';
import db from './db/index.js';


import summaryRouter from "./routers/summary.js";
import driversRouter from "./routers/drivers.js";

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
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});


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
	standardHeaders: true,
	legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting to all requests
app.use(limiter);

// Log each request
app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', summaryRouter);
app.use('/api', driversRouter);


// Routes
app.get('/', (req: Request, res: Response) => {
  logger.info('Root route accessed');
  res.send('Backend is running securely!');
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
