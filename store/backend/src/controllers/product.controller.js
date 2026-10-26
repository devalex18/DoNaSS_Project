const productService = require('../services/product.service.js');
const httpError = require('../config/httpError.js');

async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'ID de producto inválido');
    }
    const userId = req.user ? req.user.id : null;
    const updated = await productService.updateProduct(id, req.body, userId);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  update,
};