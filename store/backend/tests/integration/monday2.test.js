const request = require('supertest');
const app = require('../../src/app');
const { serializeProduct, serializeProductList } = require('../../src/serializers/product.serializer');
const { createProduct } = require('../../src/controllers/product.controller');
const errorHandler = require('../../src/middlewares/errorHandler');

describe('Módulo de Productos y Cobertura General', () => {

  // 1. Pruebas de integración para POST /api/products
  describe('POST /api/products', () => {
    it('debería crear un producto exitosamente cuando los datos son válidos', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Playera Manga Corta Algodón',
          description: 'Playera básica de cuello redondo unisex',
          price: 299.99,
          stock: 25,
          sku: 'PLY-ALG-001',
          categoryId: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'Playera Manga Corta Algodón');
    });

    it('debería fallar y retornar 400 si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          description: 'Falta el nombre y el precio de la prenda'
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('Product Controller Unit Tests', () => {
    it('debería ejecutar el flujo de éxito del controlador directamente', async () => {
      const req = {
        body: {
          name: 'Pantalón de Lino',
          description: 'Pantalón fresco para verano',
          price: 699.00,
          stock: 10,
          sku: 'PNT-LINO-01',
          categoryId: 1
        }
      };

      let statusCalledWith = null;
      let jsonCalledWith = null;

      const res = {
        status: function(code) {
          statusCalledWith = code;
          return {
            json: function(data) {
              jsonCalledWith = data;
            }
          };
        }
      };
      const next = function(err) {
        // Si entra aquí, sabremos si hubo un error en el servicio
        console.log("Error capturado en next:", err);
      };

      await createProduct(req, res, next);

      expect(statusCalledWith).toEqual(201);
      expect(jsonCalledWith).toHaveProperty('success', true);
      expect(jsonCalledWith).toHaveProperty('message', 'Producto creado exitosamente');
    });
  });

  // 3. Pruebas para el Serializador de Productos (Ropa)
  describe('Product Serializer Unit Tests', () => {
    it('debería serializar un producto de ropa correctamente transformando tipos', () => {
      const raw = {
        id: 1,
        name: 'Chamarra Mezclilla Oversize',
        description: 'Chamarra clásica azul de mezclilla gruesa',
        price: '899.50',
        stock: 12,
        sku: 'CHM-MEZ-002',
        categoryId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = serializeProduct(raw);
      expect(result).toHaveProperty('price', 899.50);
      expect(result).toHaveProperty('id', 1);
    });

    it('debería retornar null si el producto pasado es nulo', () => {
      expect(serializeProduct(null)).toBeNull();
    });

    it('debería manejar una lista de prendas vacía o inválida', () => {
      expect(serializeProductList(null)).toEqual([]);
      
      const rawList = [{
        id: 1, name: 'Pantalón Jean Slim Fit', price: 599.00, stock: 8, sku: 'PNT-JNS-001', categoryId: 1
      }];
      const listResult = serializeProductList(rawList);
      expect(listResult.length).toBe(1);
    });
  });

  // 4. Pruebas para el Middleware de Errores (Sin usar jest.fn)
  describe('Error Handler Middleware Unit Tests', () => {
    it('debería capturar el error y retornar la respuesta adecuada', () => {
      const err = new Error('Error de prueba en el servidor de la tienda');
      err.status = 500;
      
      const req = {};
      let statusCode = null;
      let bodyData = null;

      const res = {
        status: function(code) {
          statusCode = code;
          return {
            json: function(data) {
              bodyData = data;
            }
          };
        }
      };
      const next = function() {};

      errorHandler(err, req, res, next);

      expect(statusCode).toEqual(500);
      expect(bodyData).toHaveProperty('message', 'Error de prueba en el servidor de la tienda');
    });
  });

});