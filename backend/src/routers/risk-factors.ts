import express from 'express';
import { riskFactorsController } from '../controllers/risk-factors.js';

const router = express.Router();

router.get('/risk-factors', riskFactorsController);

export default router;