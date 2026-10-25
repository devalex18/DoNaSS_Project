const { createProductService } = require('../services/product.service');
const { serializeProduct } = require('../serializers/product.serializer');

const createProduct = async (req, res, next) => {
  try {
    const rawProduct = await createProductService(req.body);
    const formattedProduct = serializeProduct(rawProduct);

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: formattedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
};