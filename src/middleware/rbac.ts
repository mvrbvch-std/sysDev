import { Request, Response, NextFunction } from 'express';

type AppRole = 'SUPERADMIN' | 'MERCHANT' | 'SPONSOR' | 'CONSUMER';

export function requireRole(allowed: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.header('x-role') as AppRole | undefined;

    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: 'Forbidden by RBAC policy' });
    }

    return next();
  };
}
