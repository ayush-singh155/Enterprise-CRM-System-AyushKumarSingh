import { Router } from 'express';
import * as controller from '../controllers/customerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validation/common.js';
import {
  createCustomerSchema,
  listCustomersSchema,
  updateCustomerSchema
} from '../validation/customerValidation.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listCustomersSchema, 'query'), controller.list);
router.post('/', validate(createCustomerSchema), controller.create);
router.get('/:id', validate(idParams, 'params'), controller.read);
router.patch('/:id', validate(idParams, 'params'), validate(updateCustomerSchema), controller.update);
router.delete('/:id', validate(idParams, 'params'), controller.remove);
export default router;
