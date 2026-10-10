import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service.js';
import { JwtGuard } from '#src/auth/jwt.guard.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from './entities/user-role.enum.js';
import { SetModeratorRoleDto } from './dto/set-moderator-role.dto.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    username: string;
    roles: UserRole[];
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const users = await this.usersService.findAllUsers();
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (isAdmin) {
      return users.map(({ password: _password, ...user }) => user);
    }

    return users.map(
      ({ id, username, roles, about, avatar, telegramUsername, createdAt, updatedAt }) => ({
        id,
        username,
        roles,
        about,
        avatar,
        telegramUsername,
        createdAt,
        updatedAt,
      }),
    );
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async findMe(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findUserById(req.user.id);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, yandexId, ...profile } = user;

    return profile;
  }

  @UseGuards(JwtGuard)
  @Get(':username')
  async findUser(@Param('username') username: string) {
    const user = await this.usersService.findUserByFilter({ username });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, yandexId, email, ...publicUser } = user;

    return publicUser;
  }

  @UseGuards(JwtGuard)
  @Post('update')
  async updateMe(@Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findUserById(req.user.id);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (dto.username !== undefined) {
      const existingUser = await this.usersService.findUserByFilter({
        username: dto.username,
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException(
          'Это имя пользователя уже используется',
        );
      }
    }

    const result = await this.usersService.updateUser(user.id, dto);

    if (result.affected === 0) {
      throw new NotFoundException('Пользователь не найден');
    }

    const updatedUser = await this.usersService.findUserById(user.id);

    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, yandexId, ...profile } = updatedUser;

    return profile;
  }

  @UseGuards(JwtGuard)
  @Patch(':id/moderator')
  async setModeratorRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetModeratorRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администратор может управлять ролью модератора',
      );
    }

    if (id === req.user.id) {
      throw new ForbiddenException(
        'Нельзя изменять собственную роль модератора',
      );
    }

    const user = await this.usersService.setModeratorRole(id, dto.enabled);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return { id: user.id, roles: user.roles };
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (id !== req.user.id && !isAdmin) {
      throw new ForbiddenException(
        'Можно удалить только свой аккаунт',
      );
    }

    const targetUser = await this.usersService.findUserById(id);

    if (!targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (targetUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Учётную запись администратора нельзя удалить',
      );
    }

    const result = await this.usersService.removeUser(id);

    if (result.affected === 0) {
      throw new NotFoundException('Пользователь не найден');
    }
  }
}
