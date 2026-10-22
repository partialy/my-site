import { createHmac } from 'node:crypto';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { publicIdSchema } from '../shared/public-id';

export const USER_JWT_EXPIRES_IN = 12 * 60 * 60;
const ISSUER = 'nodebase-user';
const AUDIENCE = 'nodebase-client';

const payloadSchema = z.object({
  sub: z.union([publicIdSchema, z.string().regex(/^\d+$/)]),
  ver: z.number().int().nonnegative(),
});

export class UserJwtService {
  private readonly secret: Buffer;

  constructor(serverJwtSecret: string) {
    // 派生独立签名密钥，管理员 JWT 无法用于用户接口，用户 JWT 也无法用于管理端。
    this.secret = createHmac('sha256', serverJwtSecret).update('nodebase:user-jwt:v1').digest();
  }

  sign(userUuid: string, tokenVersion: number): string {
    return jwt.sign({ ver: tokenVersion }, this.secret, {
      algorithm: 'HS256', expiresIn: USER_JWT_EXPIRES_IN,
      subject: userUuid, issuer: ISSUER, audience: AUDIENCE,
    });
  }

  verify(token: string): { userUuid?: string; userId?: number; tokenVersion: number } {
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) throw new ApiError(401, ApiCode.TokenExpired, '登录已过期');
      if (error instanceof JsonWebTokenError) throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
      throw error;
    }
    const parsed = payloadSchema.safeParse(decoded);
    if (!parsed.success) throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
    return publicIdSchema.safeParse(parsed.data.sub).success
      ? { userUuid: parsed.data.sub, tokenVersion: parsed.data.ver }
      : { userId: Number(parsed.data.sub), tokenVersion: parsed.data.ver };
  }
}
