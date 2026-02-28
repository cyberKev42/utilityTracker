import { Router } from 'express';
import * as userPreferencesController from '../controllers/userPreferencesController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/currency', userPreferencesController.getCurrency);
router.put('/currency', userPreferencesController.updateCurrency);

export default router;
