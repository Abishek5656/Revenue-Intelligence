import express from 'express';
import { recommendationsController } from '../controllers/recommendations.js';

const router = express.Router();

router.get('/recommendations', recommendationsController);

export default router;
