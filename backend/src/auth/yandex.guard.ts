import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from './auth.service.js';

@Injectable()
export class YandexGuard extends AuthGuard('yandex') {
  private readonly logger = new Logger(YandexGuard.name);

  handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | undefined,
  ): TUser {
    if (error || !user) {
      const reason =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : error
              ? 'Unknown error returned by the Yandex strategy'
              : 'No user returned by the Yandex strategy';
      this.logger.warn(`Yandex OAuth authentication failed: ${reason}`);
      throw new UnauthorizedException(
        'Не удалось получить данные пользователя от Яндекса',
      );
    }

    return user;
  }
}
