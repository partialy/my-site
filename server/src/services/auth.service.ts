import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import type { ChangePasswordRequest, LoginRequest, ResetPasswordRequest } from '../api/schemas';
import type { AdminSummary, LoginData } from '../api/types';
import { AdminRepository } from '../repositories/admin.repository';
import { JWT_EXPIRES_IN, JwtService } from '../security/jwt.service';
import { hashPassword, verifyPassword } from '../security/password';
import { verifySetupKey } from '../security/setup-key';

export class AuthService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly tokens: JwtService,
    private readonly setupKey: string,
  ) {}

  async login(input: LoginRequest): Promise<LoginData> {
    const admin = this.admins.find();
    if (!admin || admin.username !== input.username || !await verifyPassword(input.password, admin.password_hash)) {
      throw new ApiError(401, ApiCode.InvalidCredentials, '账号或密码错误');
    }
    return {
      token: this.tokens.sign(admin.id, admin.token_version),
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRES_IN,
      admin: { id: admin.id, username: admin.username },
    };
  }

  authenticate(token: string): AdminSummary {
    const payload = this.tokens.verify(token);
    const admin = this.admins.find();
    if (!admin || admin.id !== payload.adminId || admin.token_version !== payload.tokenVersion) {
      throw new ApiError(401, ApiCode.TokenInvalid, '登录凭证无效');
    }
    return { id: admin.id, username: admin.username };
  }

  async changePassword(input: ChangePasswordRequest): Promise<void> {
    const admin = this.admins.find();
    if (!admin || !await verifyPassword(input.oldPassword, admin.password_hash)) {
      throw new ApiError(400, ApiCode.OldPasswordInvalid, '原密码错误');
    }
    this.admins.updatePassword(await hashPassword(input.newPassword));
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const admin = this.admins.find();
    if (!admin) {
      throw new ApiError(404, ApiCode.NotFound, '管理员尚未初始化');
    }
    if (!verifySetupKey(input.setupKey, this.setupKey)) {
      throw new ApiError(403, ApiCode.SetupKeyInvalid, '初始化密钥错误');
    }
    this.admins.updatePassword(await hashPassword(input.newPassword));
  }
}
