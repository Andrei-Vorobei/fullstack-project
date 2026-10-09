import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from './auth.service.js';

@Injectable()
export class YandexGuard extends AuthGuard('yandex') {
  handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | undefined,
  ): TUser {
    if (error || !user) {
      throw new UnauthorizedException(
        'Не удалось получить данные пользователя от Яндекса',
      );
    }

    return user;
  }
}
