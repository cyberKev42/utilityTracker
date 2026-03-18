import { Router } from 'express';
import * as sectionsController from '../controllers/sectionsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Section CRUD
router.get('/', sectionsController.getAll);
router.post('/', sectionsController.create);
router.put('/reorder', sectionsController.reorder);
router.put('/:id', sectionsController.update);
router.delete('/:id', sectionsController.remove);
router.post('/:id/archive', sectionsController.archive);
router.post('/:id/unarchive', sectionsController.unarchive);

// Meter CRUD (nested under section)
router.post('/:id/meters', sectionsController.createMeter);
router.put('/:id/meters/reorder', sectionsController.reorderMeters);
router.put('/:sectionId/meters/:meterId', sectionsController.updateMeter);
router.delete('/:sectionId/meters/:meterId', sectionsController.removeMeter);

// Meter last reading (convenience endpoint)
router.get('/meters/:meterId/last-reading', sectionsController.getLastReading);

export default router;
