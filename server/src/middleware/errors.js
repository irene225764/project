export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'Route not found'));
}

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 500 ? 'Something went wrong' : error.message;
  return res.status(status).json({ success: false, message });
}