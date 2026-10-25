const customerModel = require('../models/customer.model.js');
const httpError = require('../config/httpError.js');

async function searchCustomers(q) {
  return customerModel.search(q);
}

async function getCustomerById(id) {
  const customer = await customerModel.findById(id);
  if (!customer) {
    throw httpError(404, 'Cliente no encontrado');
  }
  return customer;
}

async function createCustomer(data) {
  const existing = await customerModel.findByPhone(data.phone);
  if (existing) {
    throw httpError(409, 'Ya existe un cliente registrado con ese número de teléfono');
  }
  return customerModel.create(data);
}

module.exports = {
  searchCustomers,
  getCustomerById,
  createCustomer,
};