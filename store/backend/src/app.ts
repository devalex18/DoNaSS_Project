import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import { SECURITY } from './config/constants';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

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
    name: SECURITY.SESSION_COOKIE_NAME,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: SECURITY.SESSION_TIMEOUT_MS,
    },
  })
);

app.use('/api', routes);

app.use(errorHandler);

export default app;