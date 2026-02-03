import express from 'express';
import { summaryController } from '../controllers/summary.js';

const router = express.Router();

router.get('/summary', summaryController);

export default router;