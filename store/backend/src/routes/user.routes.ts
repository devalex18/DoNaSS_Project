import { Router } from 'express';
import { list, create, update, remove, reactivate, resetPassword } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { validate } from '../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
  tempPasswordSchema,
} from '../validators/user.validator';
import { ROLES } from '../config/constants';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/', list);
router.post('/', validate(createUserSchema), create);
router.patch('/:id', validate(updateUserSchema), update);
router.delete('/:id', remove);
router.patch('/:id/reactivate', validate(tempPasswordSchema), reactivate);
router.post('/:id/reset-password', validate(tempPasswordSchema), resetPassword);

export default router;