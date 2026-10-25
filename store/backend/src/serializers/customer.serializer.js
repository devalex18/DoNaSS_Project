function serializeCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    socialMediaProfile: c.socialMediaProfile ?? null,
  };
}

module.exports = { serializeCustomer };