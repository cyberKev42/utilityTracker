import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:type', settingsController.getUnitPrice);
router.put('/:type', settingsController.updateUnitPrice);

export default router;
