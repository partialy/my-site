import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';

export const JWT_EXPIRES_IN = 12 * 60 * 60;
const ISSUER = 'mysite-server';
const jwtPayloadSchema = z.object({
  sub: z.string().regex(/^\d+$/),
  ver: z.number().int().nonnegative(),
});

export interface AdminTokenPayload {
  adminId: number;
  tokenVersion: number;
}

export class JwtService {
  constructor(private readonly secret: string) {}

  sign(adminId: number, tokenVersion: number): string {
    return jwt.sign({ ver: tokenVersion }, this.secret, {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN,
      subject: String(adminId),
      issuer: ISSUER,
    });
  }

  verify(token: string): AdminTokenPayload {
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError(401, ApiCode.TokenExpired, '登录已过期');
      }
      if (error instanceof JsonWebTokenError) {
        throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
      }
      throw error;
    }

    const parsed = jwtPayloadSchema.safeParse(decoded);
    if (!parsed.success) throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
    return { adminId: Number(parsed.data.sub), tokenVersion: parsed.data.ver };
  }
}
