import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OAuthController } from './oauth.controller.js';
import { AuthService, AuthenticatedUser } from './auth.service.js';

describe('OAuthController', () => {
  let controller: OAuthController;
  const authService = {
    createTokenPair: vi.fn(),
  };
  const configService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
  });

  it('sets the refresh cookie and redirects to the configured frontend', async () => {
    const user = { id: 'user-id' } as AuthenticatedUser;
    const response = {
      cookie: vi.fn(),
      redirect: vi.fn(),
    };
    authService.createTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    configService.get.mockImplementation((key: string) =>
      key === 'FRONTEND_URL' ? 'https://shop.example.com' : undefined,
    );

    await controller.yandexCallback(
      { user } as Request & { user?: AuthenticatedUser },
      response as unknown as Response,
    );

    expect(authService.createTokenPair).toHaveBeenCalledWith(user.id);
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.any(Object),
    );
    expect(response.redirect).toHaveBeenCalledWith('https://shop.example.com');
  });

  it('falls back to the first allowed frontend origin', async () => {
    const user = { id: 'user-id' } as AuthenticatedUser;
    const response = {
      cookie: vi.fn(),
      redirect: vi.fn(),
    };
    authService.createTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    configService.get.mockImplementation((key: string) =>
      key === 'FRONTEND_ORIGINS'
        ? 'https://shop.example.com,https://admin.example.com'
        : undefined,
    );

    await controller.yandexCallback(
      { user } as Request & { user?: AuthenticatedUser },
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith('https://shop.example.com');
  });
});
