import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import { AppError } from './errors.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) throw new AppError(401, 'Authentication required');
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { id: payload.sub, role: payload.role };
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new AppError(403, 'Admin access required'));
  return next();
}