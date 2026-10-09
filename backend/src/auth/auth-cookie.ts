import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants.js';

function getCookieOptions(configService: ConfigService) {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/auth',
  };
}

export function setRefreshCookie(
  response: Response,
  refreshToken: string,
  configService: ConfigService,
): void {
  response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...getCookieOptions(configService),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearRefreshCookie(
  response: Response,
  configService: ConfigService,
): void {
  response.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions(configService));
}
