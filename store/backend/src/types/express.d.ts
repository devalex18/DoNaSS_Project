import { Role } from '../config/constants.ts';

export interface SessionUser {
  id: number;
  role: Role;
  mustChangePassword: boolean;
}

declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: Role;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}