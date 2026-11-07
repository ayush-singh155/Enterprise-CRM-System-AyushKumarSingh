import { Router } from 'express';
import * as controller from '../controllers/dealController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validation/common.js';
import {
  createDealSchema,
  listDealsSchema,
  updateDealSchema,
  updateDealStageSchema
} from '../validation/dealValidation.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listDealsSchema, 'query'), controller.list);
router.post('/', validate(createDealSchema), controller.create);
router.patch('/:id/stage', validate(idParams, 'params'), validate(updateDealStageSchema), controller.updateStage);
router.get('/:id', validate(idParams, 'params'), controller.read);
router.patch('/:id', validate(idParams, 'params'), validate(updateDealSchema), controller.update);
router.delete('/:id', validate(idParams, 'params'), controller.remove);
export default router;
