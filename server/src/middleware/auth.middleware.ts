import type { RequestHandler, Response } from 'express';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import type { AdminSummary } from '../api/types';
import { AuthService } from '../services/auth.service';

export function requireAuth(auth: AuthService): RequestHandler {
  return (_req, res, next) => {
    const header = _req.header('authorization');
    if (!header) return next(new ApiError(401, ApiCode.AuthRequired, '请先登录'));

    const match = /^Bearer (\S+)$/i.exec(header);
    if (!match?.[1]) return next(new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效'));
    try {
      res.locals.admin = auth.authenticate(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authenticatedAdmin(res: Response): AdminSummary {
  const admin = res.locals.admin as AdminSummary | undefined;
  if (!admin) throw new ApiError(401, ApiCode.AuthRequired, '请先登录');
  return admin;
}
