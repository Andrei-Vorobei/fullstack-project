import {
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LocalGuard } from './local.guard.js';
import { AuthService, AuthenticatedUser } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { SigninUserDto } from './dto/signin-user.dto.js';
import { clearRefreshCookie, setRefreshCookie } from './auth-cookie.js';
import { REFRESH_COOKIE_NAME } from './auth.constants.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('signin')
  async signin(
    @Body() _dto: SigninUserDto,
    @Req() req: { user: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.createTokenPair(req.user.id);
    setRefreshCookie(response, tokens.refreshToken, this.configService);

    const user = await this.usersService.findUserById(req.user.id);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, yandexId, ...profile } = user;

    return { ...profile, access_token: tokens.accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = this.getRefreshToken(req);

    return {
      access_token: await this.authService.refreshAccessToken(refreshToken),
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    clearRefreshCookie(response, this.configService);

    return { message: 'Выход выполнен' };
  }

  @Post('signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const existingEmail = await this.usersService.findUserByFilter({
      email: dto.email,
    });

    if (existingEmail) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );
    }

    const existingUsername = await this.usersService.findUserByFilter({
      username: dto.username,
    });

    if (existingUsername) {
      throw new ConflictException(
        'Это отображаемое имя уже используется',
      );
    }

    const createdUser = await this.usersService.createUser(dto);
    const tokens = await this.authService.createTokenPair(createdUser.id);
    setRefreshCookie(response, tokens.refreshToken, this.configService);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, yandexId, ...profile } = createdUser;

    return { ...profile, access_token: tokens.accessToken };
  }

  private getRefreshToken(request: Request): string {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_COOKIE_NAME}=`));

    if (!cookie) {
      throw new UnauthorizedException('Refresh-токен не найден');
    }

    return cookie.slice(`${REFRESH_COOKIE_NAME}=`.length);
  }
}
