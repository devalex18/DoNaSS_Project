const express = require('express');
const productController = require('../controllers/product.controller.js');
const validate = require('../middlewares/validate.js');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator.js');

const router = express.Router();

router.post('/', validate(createProductSchema), productController.create);
router.patch('/:id', validate(updateProductSchema), productController.update);

module.exports = router;