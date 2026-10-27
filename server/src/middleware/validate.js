import { validationResult } from 'express-validator';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result.array({ onlyFirstError: true })[0].msg;
    return next(Object.assign(new Error(message), { status: 400 }));
  }
  return next();
}