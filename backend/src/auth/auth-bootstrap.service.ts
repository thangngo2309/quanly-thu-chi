import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class AuthBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const hasSystemAdmin = await this.usersService.hasSystemAdmin();

    if (hasSystemAdmin) {
      return;
    }

    const username = this.configService.get<string>('SYSTEM_ADMIN_USERNAME');

    const password = this.configService.get<string>('SYSTEM_ADMIN_PASSWORD');

    const fullName =
      this.configService.get<string>('SYSTEM_ADMIN_FULL_NAME') ??
      'System Administrator';

    if (!username || !password) {
      this.logger.warn(
        'Chưa có system_admin và chưa cấu hình SYSTEM_ADMIN_USERNAME, SYSTEM_ADMIN_PASSWORD',
      );

      return;
    }

    await this.usersService.create({
      username,
      password,
      fullName,
      role: UserRole.SYSTEM_ADMIN,
    });

    this.logger.log(`Đã tạo tài khoản system_admin: ${username}`);
  }
}
