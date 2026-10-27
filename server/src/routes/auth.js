import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, checkExact } from 'express-validator';
import asyncHandler from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authController from '../controllers/authController.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters'),
];
const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters'),
];

router.post('/register', authLimiter, registerRules, checkExact(registerRules, { locations: ['body'] }), validate, asyncHandler(authController.register));
router.post('/login', authLimiter, loginRules, checkExact(loginRules, { locations: ['body'] }), validate, asyncHandler(authController.login));
router.get('/me', requireAuth, asyncHandler(authController.me));

export default router;