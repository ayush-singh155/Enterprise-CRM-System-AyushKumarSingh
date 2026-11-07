import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../validation/userValidation.js';

const router = Router();
router.use(authenticate);
router.get('/assignees', controller.assignees);
router.get('/', authorize('admin'), controller.list);
router.post('/', authorize('admin'), validate(createUserSchema), controller.create);
export default router;
