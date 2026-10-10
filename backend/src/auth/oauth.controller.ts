import {
  Controller,
  Get,
  Res,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, AuthenticatedUser } from './auth.service.js';
import { YandexGuard } from './yandex.guard.js';
import { setRefreshCookie } from './auth-cookie.js';

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(YandexGuard)
  @Get('yandex')
  yandex() {
    // Пустой метод — нормально. Стратегия сама инициирует редирект на Яндекс.
  }

  @UseGuards(YandexGuard)
  @Get('yandex/callback')
  async yandexCallback(
    @Req() req: Request & { user?: AuthenticatedUser },
    @Res() response: Response,
  ): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException(
        'Не удалось получить данные пользователя от Яндекса',
      );
    }

    const tokens = await this.authService.createTokenPair(req.user.id);
    setRefreshCookie(response, tokens.refreshToken, this.configService);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.trim() ||
      this.configService
        .get<string>('FRONTEND_ORIGINS')
        ?.split(',')[0]
        ?.trim() ||
      'http://localhost:5173';

    response.redirect(frontendUrl);
  }
}
