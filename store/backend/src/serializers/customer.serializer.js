function serializeCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    socialMediaProfile: customer.socialMediaProfile ?? null,
  };
}

module.exports = { serializeCustomer };