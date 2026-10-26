const express = require('express');
const productController = require('../controllers/product.controller.js');
const validate = require('../middlewares/validate.js');
const { createProductSchema } = require('../validators/product.validator.js');

const router = express.Router();

router.post('/', validate(createProductSchema), productController.create);

module.exports = router;