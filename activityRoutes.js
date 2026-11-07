import { Router } from 'express';
import * as controller from '../controllers/activityController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createActivitySchema,
  sendEmailSchema,
  timelineQuerySchema
} from '../validation/activityValidation.js';

const router = Router();
router.use(authenticate);
router.get('/timeline', validate(timelineQuerySchema, 'query'), controller.timeline);
router.post('/', validate(createActivitySchema), controller.create);
router.post('/email', validate(sendEmailSchema), controller.sendEmail);
export default router;
