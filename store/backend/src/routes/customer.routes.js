const express = require('express');
const customerController = require('../controllers/customer.controller.js');
const validate = require('../middlewares/validate.js');
const { createCustomerSchema } = require('../validators/customer.validator.js');

const router = express.Router();

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.post('/', validate(createCustomerSchema), customerController.create);

module.exports = router;