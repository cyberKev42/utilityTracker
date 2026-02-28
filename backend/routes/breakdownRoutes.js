import { Router } from 'express';
import * as breakdownController from '../controllers/breakdownController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/breakdown/:type', breakdownController.getBreakdown);

export default router;
