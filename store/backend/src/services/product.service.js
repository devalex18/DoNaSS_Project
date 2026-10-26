const productModel = require('../models/product.model.js');
const httpError = require('../config/httpError.js');

async function createProduct(data) {
  const combinations = new Set();
  for (const v of data.variants) {
    const key = `${v.size.toLowerCase()}-${v.color.toLowerCase()}`;
    if (combinations.has(key)) {
      throw httpError(409, 'No puedes repetir la misma combinación de talla y color');
    }
    combinations.add(key);
  }

  const existing = await productModel.findDuplicate(data.name, data.variants);
  if (existing) {
    throw httpError(409, 'Ya existe un producto con el mismo nombre, talla y color');
  }

  return productModel.create(data);
}

async function updateProduct(id, data, userId) {
  const currentProduct = await productModel.findById(id);
  if (!currentProduct) {
    throw httpError(404, 'Producto no encontrado');
  }

  return productModel.updateWithHistory(id, currentProduct, data, userId);
}

module.exports = {
  createProduct,
  updateProduct,
};