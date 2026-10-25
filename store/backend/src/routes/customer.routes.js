const express = require('express');
const customerController = require('../controllers/customer.controller.js');
const requireAuth = require('../middlewares/auth.js');
const validate = require('../middlewares/validate.js');
const { createCustomerSchema } = require('../validators/customer.validator.js');

const router = express.Router();

router.use(requireAuth);

router.get('/', customerController.list);
router.post('/', validate(createCustomerSchema), customerController.create);

module.exports = router;