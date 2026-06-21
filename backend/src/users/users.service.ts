import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const keyword = query.q?.trim();

    if (keyword) {
      queryBuilder.andWhere(
        `(
            user.username ILIKE :keyword
            OR user.fullName ILIKE :keyword
          )`,
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', {
        role: query.role,
      });
    }

    if (typeof query.isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const [items, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const username = this.normalizeUsername(dto.username);

    const existing = await this.userRepository.findOne({
      where: {
        username,
      },
    });

    if (existing) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    const passwordHash = await hash(dto.password, 12);

    const user = this.userRepository.create({
      username,
      fullName: dto.fullName.trim(),
      passwordHash,
      role: dto.role ?? UserRole.ADMIN,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);

    return this.findPublicById(saved.id);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.id === currentUserId && dto.isActive === false) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của mình');
    }

    if (
      user.id === currentUserId &&
      dto.role &&
      dto.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new BadRequestException(
        'Bạn không thể tự hạ quyền tài khoản của mình',
      );
    }

    const removingSystemAdmin =
      user.role === UserRole.SYSTEM_ADMIN &&
      (dto.role === UserRole.ADMIN || dto.isActive === false);

    if (removingSystemAdmin) {
      const activeSystemAdmins = await this.userRepository.count({
        where: {
          role: UserRole.SYSTEM_ADMIN,
          isActive: true,
        },
      });

      if (activeSystemAdmins <= 1) {
        throw new BadRequestException(
          'Hệ thống phải còn ít nhất một system_admin đang hoạt động',
        );
      }
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    await this.userRepository.save(user);

    return this.findPublicById(id);
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const passwordHash = await hash(dto.password, 12);

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        passwordHash,
      })
      .where('id = :id', {
        id,
      })
      .execute();
  }

  async findByUsernameForAuth(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', {
        username: this.normalizeUsername(username),
      })
      .getOne();
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async findPublicById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async hasSystemAdmin(): Promise<boolean> {
    const count = await this.userRepository.count({
      where: {
        role: UserRole.SYSTEM_ADMIN,
      },
    });

    return count > 0;
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }
}
