import { Router } from 'express';
import * as controller from '../controllers/taskController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validation/common.js';
import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema
} from '../validation/taskValidation.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listTasksSchema, 'query'), controller.list);
router.post('/', validate(createTaskSchema), controller.create);
router.get('/:id', validate(idParams, 'params'), controller.read);
router.patch('/:id', validate(idParams, 'params'), validate(updateTaskSchema), controller.update);
router.delete('/:id', validate(idParams, 'params'), controller.remove);
export default router;
