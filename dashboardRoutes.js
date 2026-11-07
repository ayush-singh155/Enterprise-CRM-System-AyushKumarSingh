import { Router } from 'express';
import * as controller from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { dashboardDateRangeSchema } from '../validation/dashboardValidation.js';

const router = Router();
router.use(authenticate, validate(dashboardDateRangeSchema, 'query'));
router.get('/summary', controller.summary);
router.get('/kpis', controller.kpis);
router.get('/monthly-revenue', controller.monthlyRevenue);
router.get('/leads-by-source', controller.leadsBySource);
router.get('/deals-by-stage', controller.dealsByStage);
router.get('/top-reps', controller.topPerformingReps);
export default router;
