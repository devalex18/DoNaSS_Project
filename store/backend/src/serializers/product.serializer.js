const serializeProduct = (product) => {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price ? Number(product.price) : 0,
    stock: product.stock,
    sku: product.sku,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const serializeProductList = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(serializeProduct);
};

module.exports = {
  serializeProduct,
  serializeProductList,
};