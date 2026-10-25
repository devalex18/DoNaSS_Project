const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const customerRoutes = require('./routes/customer.routes.js');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/customers', customerRoutes);

app.use(errorHandler);

module.exports = app;