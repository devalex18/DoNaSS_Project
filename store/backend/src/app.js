const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { SESSION_TIMEOUT_MS } = require('./config/constants.js');
const authRoutes = require('./routes/auth.routes.js');
const productRoutes = require('./routes/product.routes.js');
const errorHandler = require('./middlewares/errorHandler.js');
const userRoutes = require('./routes/customer.routes.js');
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_MS,
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);

app.use(errorHandler);

module.exports = app;