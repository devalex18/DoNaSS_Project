import { Router } from 'express';
import { list, create, update } from '../controllers/product.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, requireRole(ROLES.ADMIN), validate(createProductSchema), create);
router.patch('/:id', requireAuth, requireRole(ROLES.ADMIN), validate(updateProductSchema), update);

export default router;