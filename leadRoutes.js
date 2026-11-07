import { Router } from 'express';
import * as controller from '../controllers/leadController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validation/common.js';
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from '../validation/leadValidation.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listLeadsSchema, 'query'), controller.list);
router.post('/', validate(createLeadSchema), controller.create);
router.post('/:id/convert', validate(idParams, 'params'), controller.convert);
router.get('/:id', validate(idParams, 'params'), controller.read);
router.patch('/:id', validate(idParams, 'params'), validate(updateLeadSchema), controller.update);
router.delete('/:id', validate(idParams, 'params'), controller.remove);
export default router;
