const productService = require('../services/product.service.js');

async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

module.exports = { create };