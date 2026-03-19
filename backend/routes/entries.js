import { Router } from 'express';
import * as entriesController from '../controllers/entriesController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', entriesController.getEntries);
router.get('/stats', entriesController.getStats);
router.post('/', entriesController.create);
router.delete('/:id', entriesController.remove);

export default router;
