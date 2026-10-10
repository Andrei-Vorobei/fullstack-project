import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { Profile } from 'passport-yandex';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './auth.constants.js';

export type AuthenticatedUser = Pick<User, 'id'>;

type TokenPayload = {
  sub: string;
  tokenType: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async createTokenPair(id: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          tokenType: 'access',
        } satisfies TokenPayload,
        { expiresIn: ACCESS_TOKEN_TTL },
      ),
      this.jwtService.signAsync(
        {
          sub: id,
          tokenType: 'refresh',
        } satisfies TokenPayload,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TOKEN_TTL,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    let payload: unknown;
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    try {
      payload = await this.jwtService.verifyAsync<Record<string, unknown>>(refreshToken, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    if (typeof payload !== 'object' || payload === null) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    if (!('sub' in payload) || !('tokenType' in payload)) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    const { sub, tokenType } = payload;

    if (
      tokenType !== 'refresh' ||
      typeof sub !== 'string' ||
      !isUUID(sub)
    ) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    const user = await this.usersService.findUserById(sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return this.jwtService.signAsync(
      {
        sub,
        tokenType: 'access',
      } satisfies TokenPayload,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
  }

  async validatePassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.findUserByFilter({ email });

    if (!user || !user.password) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return { id: user.id };
  }

  async validateFromYandex(profile: Profile): Promise<AuthenticatedUser> {
    let user = await this.usersService.findByYandexID(profile.id);

    user = user
      ? await this.usersService.updateYandexAvatar(user, profile)
      : await this.usersService.createFromYandex(profile);

    return { id: user.id };
  }
}
