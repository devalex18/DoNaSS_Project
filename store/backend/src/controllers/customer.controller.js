const customerService = require('../services/customer.service.js');
const { serializeCustomer } = require('../serializers/customer.serializer.js');

async function list(req, res, next) {
  try {
    const customers = await customerService.searchCustomers(req.query.q);
    res.status(200).json(customers.map(serializeCustomer));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(serializeCustomer(customer));
  } catch (err){
    next(err);
  }
}

module.exports = { list, create };