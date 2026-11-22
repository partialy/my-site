import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { UserRepository, type UserListRecord, type UserStatus } from '../repositories/user.repository';
import { USER_JWT_EXPIRES_IN, UserJwtService } from '../security/user-jwt.service';
import { hashPassword, verifyPassword } from '../security/password';
import { daysAgo, utcDay } from './visit.service';
import { mapPageResult, paginationQueryShape } from '../shared/pagination';
import { createPublicId, publicIdSchema } from '../shared/public-id';

const accountSchema = z.string().trim().min(3).max(32).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, '账号只能包含字母、数字和下划线，且以字母开头');
const passwordSchema = z.string().min(8).max(128);
export const userRegisterSchema = z.strictObject({
  account: accountSchema,
  password: passwordSchema,
  nickname: z.string().trim().min(1).max(50).optional(),
});
export const userLoginSchema = z.strictObject({ account: z.string().trim().min(1), password: z.string().min(1) });
export const userListQuerySchema = z.strictObject({
  ...paginationQueryShape,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});
export const userIdSchema = publicIdSchema;
export const userStatusSchema = z.strictObject({ status: z.enum(['active', 'disabled']) });
export const userProfileSchema = z.strictObject({
  nickname: z.string().trim().min(1).max(50),
  avatar: z.string().trim().max(2048).refine((value) => {
    try { return ['http:', 'https:'].includes(new URL(value).protocol); }
    catch { return false; }
  }, '头像地址需为 HTTP(S) URL').nullable(),
});

export interface UserSummary {
  uuid: string;
  account: string;
  nickname: string;
  avatar: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

function summary(user: UserListRecord): UserSummary {
  return {
    uuid: user.uuid, account: user.account, nickname: user.nickname, avatar: user.avatar,
    status: user.status, createdAt: user.created_at, updatedAt: user.updated_at,
  };
}

export class UserService {
  constructor(private readonly users: UserRepository, private readonly tokens: UserJwtService) {}

  async register(input: z.infer<typeof userRegisterSchema>): Promise<UserSummary> {
    if (this.users.findByAccount(input.account)) {
      throw new ApiError(409, ApiCode.UserAccountExists, '账号已存在');
    }
    const passwordHash = await hashPassword(input.password);
    try {
      return summary(this.users.create(createPublicId(), input.account, passwordHash, input.nickname ?? input.account));
    } catch (error) {
      // 并发注册时仍由数据库唯一约束兜底。
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: user.account')) {
        throw new ApiError(409, ApiCode.UserAccountExists, '账号已存在');
      }
      throw error;
    }
  }

  async login(input: z.infer<typeof userLoginSchema>) {
    const user = this.users.findByAccount(input.account);
    if (!user || !await verifyPassword(input.password, user.password_hash)) {
      throw new ApiError(401, ApiCode.InvalidCredentials, '账号或密码错误');
    }
    if (user.status === 'disabled') throw new ApiError(403, ApiCode.TokenInvalid, '账号已禁用');
    this.recordActivity(user.id);
    return {
      token: this.tokens.sign(user.uuid, user.token_version), tokenType: 'Bearer' as const,
      expiresIn: USER_JWT_EXPIRES_IN, user: summary(user),
    };
  }

  authenticate(token: string): UserSummary {
    const payload = this.tokens.verify(token);
    const user = payload.userUuid ? this.users.findByUuid(payload.userUuid) : this.users.findById(payload.userId!);
    if (!user || user.token_version !== payload.tokenVersion || user.status !== 'active') {
      throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
    }
    this.recordActivity(user.id);
    return summary(user);
  }

  list(query: z.infer<typeof userListQuerySchema>) {
    return mapPageResult(this.users.list(query), summary);
  }

  detail(uuid: string): UserSummary {
    const user = this.users.findByUuid(uuid);
    if (!user) throw new ApiError(404, ApiCode.NotFound, '用户不存在');
    return summary(user);
  }

  setStatus(uuid: string, status: UserStatus): UserSummary {
    const user = this.users.updateStatus(uuid, status);
    if (!user) throw new ApiError(404, ApiCode.NotFound, '用户不存在');
    return summary(user);
  }

  updateProfile(uuid: string, input: z.infer<typeof userProfileSchema>): UserSummary {
    const user = this.users.updateProfile(uuid, input.nickname, input.avatar);
    if (!user) throw new ApiError(404, ApiCode.NotFound, '用户不存在');
    return summary(user);
  }

  dashboard(now = new Date()) {
    const startDay = daysAgo(now, 6);
    const counts = this.users.dashboard(startDay);
    const newUsers = new Map(counts.newUsersByDay.map(({ day, count }) => [day, count]));
    const activeUsers = new Map(counts.activeUsersByDay.map(({ day, count }) => [day, count]));
    return {
      source: 'real' as const,
      total: counts.total, activeLast7Days: counts.activeLast7Days,
      newLast7Days: counts.newLast7Days,
      trend7: Array.from({ length: 7 }, (_, index) => {
        const day = daysAgo(now, 6 - index);
        return { day, newUsers: newUsers.get(day) ?? 0, activeUsers: activeUsers.get(day) ?? 0 };
      }),
    };
  }

  private recordActivity(userId: number): void {
    const now = new Date();
    this.users.recordActivity(userId, utcDay(now), now.toISOString());
  }
}
