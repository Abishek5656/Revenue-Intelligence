import express from 'express';
import { summaryController, trendController } from '../controllers/summary.js';

const router = express.Router();

router.get('/summary', summaryController);
router.get('/summary/trend', trendController);

export default router;