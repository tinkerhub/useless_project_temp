import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
}
// Extend Request to include typed session
declare global {
  namespace Express {
    interface Request {
      session?: {
        accessToken?: string;
        user?: AuthenticatedUser;
        gatekeeper?: {
          status: 'welcome' | 'denied';
          dialogue: string;
        };
        [key: string]: any;
      } | null;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user || !req.session?.accessToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      gatekeeper: {
        status: 'denied',
        dialogue: 'Halt! The gate is sealed to unauthenticated wanderers.'
      }
    });
  }
  next();
}
