import express from 'express';
import { driversController } from '../controllers/drivers.js';

const router = express.Router();

router.get('/drivers', driversController);

export default router;