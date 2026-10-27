import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middleware/errors.js';

function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  const existing = await User.exists({ email });
  if (existing) throw new AppError(409, 'An account with this email already exists');
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword });
  return res.status(201).json({ success: true, data: { user: publicUser(user), token: issueToken(user) } });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !await bcrypt.compare(req.body.password, user.password)) {
    throw new AppError(401, 'Email or password is incorrect');
  }
  return res.status(200).json({ success: true, data: { user: publicUser(user), token: issueToken(user) } });
}

export async function me(req, res) {
  return res.status(200).json({ success: true, data: publicUser(req.user) });
}