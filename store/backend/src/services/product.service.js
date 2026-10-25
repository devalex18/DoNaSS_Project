const prisma = require('../models/index.model'); 

const createProductService = async (productData) => {
  try {
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        stock: Number(productData.stock),
        sku: productData.sku,
        categoryId: productData.categoryId ? Number(productData.categoryId) : null,
      },
    });

    return newProduct;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createProductService,
};