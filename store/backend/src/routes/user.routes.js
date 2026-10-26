const express = require('express');
const userController = require('../controllers/user.controller.js');
const requireAuth = require('../middlewares/auth.js');
const requireRole = require('../middlewares/roles.js');
const validate = require('../middlewares/validate.js');
const {
  createUserSchema,
  updateUserSchema,
  tempPasswordSchema,
} = require('../validators/user.validator.js');
const { ROLES } = require('../config/constants.js');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/', userController.list);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.remove);
router.patch('/:id/reactivate', validate(tempPasswordSchema), userController.reactivate);
router.post('/:id/reset-password', validate(tempPasswordSchema), userController.resetPassword);

module.exports = router;