import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) return next();
  return res.status(401).json({ error: true, message: 'Non authentifié' });
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles: string[] = (req.session as any)?.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (ok) return next();
    return res.status(403).json({ error: true, message: 'Accès refusé' });
  };
}
