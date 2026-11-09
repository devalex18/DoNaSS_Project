import { Router } from 'express';
import { list, getById, create } from '../controllers/customer.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCustomerSchema } from '../validators/customer.validator';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/:id', getById);
router.post('/', validate(createCustomerSchema), create);

export default router;