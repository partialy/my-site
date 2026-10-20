import type { RequestHandler, Response } from 'express';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { UserService, type UserSummary } from '../services/user.service';

export function requireUser(users: UserService): RequestHandler {
  return (req, res, next) => {
    const header = req.header('authorization');
    if (!header) return next(new ApiError(401, ApiCode.AuthRequired, '请先登录'));
    const match = /^Bearer (\S+)$/i.exec(header);
    if (!match?.[1]) return next(new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效'));
    try {
      res.locals.user = users.authenticate(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authenticatedUser(res: Response): UserSummary {
  const user = res.locals.user as UserSummary | undefined;
  if (!user) throw new ApiError(401, ApiCode.AuthRequired, '请先登录');
  return user;
}
