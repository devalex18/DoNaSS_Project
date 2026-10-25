const customerService = require('../services/customer.service.js');
const { serializeCustomer } = require('../serializers/customer.serializer.js');
const httpError = require('../config/httpError.js');

async function list(req, res, next) {
  try {
    const customers = await customerService.searchCustomers(req.query.q);
    return res.status(200).json(customers.map(serializeCustomer));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'El id debe ser un entero positivo');
    }
    const customer = await customerService.getCustomerById(id);
    return res.status(200).json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.body);
    return res.status(201).json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
};