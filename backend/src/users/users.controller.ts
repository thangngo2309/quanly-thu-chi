import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('users')
@Roles(UserRole.SYSTEM_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query()
    query: QueryUsersDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Post()
  create(
    @Body()
    dto: CreateUserDto,
  ) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateUserDto,

    @CurrentUser()
    currentUser: User,
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Patch(':id/password')
  async resetPassword(
    @Param('id')
    id: string,

    @Body()
    dto: ResetUserPasswordDto,
  ) {
    await this.usersService.resetPassword(id, dto);

    return {
      message: 'Đặt lại mật khẩu thành công',
    };
  }
}
