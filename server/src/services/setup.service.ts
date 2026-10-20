import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import type { AdminSummary } from '../api/types';
import type { SetupAdminRequest } from '../api/schemas';
import { AdminRepository } from '../repositories/admin.repository';
import { SetupRepository } from '../repositories/setup.repository';
import { ConfigManager } from '../config/config-manager';
import { hashPassword } from '../security/password';
import { verifySetupKey } from '../security/setup-key';

export class SetupService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly setupKey: string,
    private readonly setupRepository: SetupRepository,
    private readonly configManager: ConfigManager,
  ) {}

  isInitialized(): boolean {
    return this.admins.find() !== null;
  }

  async createInitialAdmin(input: SetupAdminRequest): Promise<AdminSummary> {
    if (this.isInitialized()) {
      throw new ApiError(409, ApiCode.AlreadyInitialized, '管理员已初始化');
    }
    if (!verifySetupKey(input.setupKey, this.setupKey)) {
      throw new ApiError(403, ApiCode.SetupKeyInvalid, '初始化密钥错误');
    }

    const passwordHash = await hashPassword(input.password);
    const admin = this.setupRepository.create(input, passwordHash);
    if (!admin) {
      throw new ApiError(409, ApiCode.AlreadyInitialized, '管理员已初始化');
    }
    this.configManager.reloadSysConfigs();
    return admin;
  }
}
