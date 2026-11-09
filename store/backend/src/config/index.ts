import dotenv from 'dotenv';

dotenv.config();

export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  frontendUrl: required('FRONTEND_URL'),
  sessionSecret: required('SESSION_SECRET'),
};

export default config;