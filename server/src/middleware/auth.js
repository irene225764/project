import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import { AppError } from './errors.js';
import User from '../models/User.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) throw new AppError(401, 'Authentication required');
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.sub).select('name email role');
  if (!user) throw new AppError(401, 'Account no longer exists');
  req.user = user;
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new AppError(403, 'Admin access required'));
  return next();
}