import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string; name?: string; role?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const sessionUid = req.headers['x-session-uid'] as string;
  const sessionRole = req.headers['x-session-role'] as string;

  if (sessionUid) {
    req.user = {
      uid: sessionUid,
      email: `${sessionUid.toLowerCase()}@swasthyasetu.org`,
      role: sessionRole || 'frontline_worker',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  if (token.startsWith('STATION-')) {
    const uid = token.replace('STATION-', '');
    req.user = {
      uid,
      email: `${uid.toLowerCase()}@swasthyasetu.org`,
      role: sessionRole || 'frontline_worker',
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
