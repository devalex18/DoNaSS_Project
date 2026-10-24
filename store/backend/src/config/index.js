require('dotenv').config();

const required = (name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
};

module.exports = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET'),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5500',
  layawayDays: Number(process.env.LAYAWAY_DAYS ?? 30),
};