import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { SigninUserDto } from './dto/signin-user.dto.js';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    createTokenPair: vi.fn(),
  };
  const usersService = {
    findUserByFilter: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  };
  const configService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the authenticated user profile and access token on sign-in', async () => {
    const userId = 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49';
    authService.createTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    usersService.findUserById.mockResolvedValue({
      id: userId,
      username: 'alice',
      email: 'alice@example.com',
      about: 'Profile',
      avatar: 'https://example.com/avatar.png',
      password: 'hashed-password',
      yandexId: null,
    });
    const response = { cookie: vi.fn() };

    await expect(
      controller.signin(
        { email: 'alice@example.com', password: 'password' } as SigninUserDto,
        { user: { id: userId } },
        response as unknown as Response,
      ),
    ).resolves.toEqual({
      id: userId,
      username: 'alice',
      email: 'alice@example.com',
      about: 'Profile',
      avatar: 'https://example.com/avatar.png',
      access_token: 'access-token',
    });

    expect(usersService.findUserById).toHaveBeenCalledWith(userId);
    expect(response.cookie).toHaveBeenCalled();
  });
});
