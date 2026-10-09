import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const jwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };
  const usersService = {
    findUserById: vi.fn(),
  };
  const configService = {
    getOrThrow: vi.fn().mockReturnValue('refresh-secret'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an access token and a refresh token for the user', async () => {
    const userId = 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49';
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(service.createTokenPair(userId)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: userId, tokenType: 'access' },
      { expiresIn: '1h' },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: userId, tokenType: 'refresh' },
      { secret: 'refresh-secret', expiresIn: '7d' },
    );
  });

  it('issues a new access token from a valid refresh token', async () => {
    const userId = 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49';
    jwtService.verifyAsync.mockResolvedValue({
      sub: userId,
      tokenType: 'refresh',
    });
    usersService.findUserById.mockResolvedValue({ id: userId });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    await expect(
      service.refreshAccessToken('refresh-token'),
    ).resolves.toBe('new-access-token');
    expect(usersService.findUserById).toHaveBeenCalledWith(userId);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: userId, tokenType: 'access' },
      { expiresIn: '1h' },
    );
  });

  it('rejects an access token used as a refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49',
      tokenType: 'access',
    });

    await expect(
      service.refreshAccessToken('access-token'),
    ).rejects.toThrow('Недействительный refresh-токен');
    expect(usersService.findUserById).not.toHaveBeenCalled();
  });

  it('rejects a refresh token with a non-UUID subject', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: '42',
      tokenType: 'refresh',
    });

    await expect(
      service.refreshAccessToken('refresh-token'),
    ).rejects.toThrow('Недействительный refresh-токен');
    expect(usersService.findUserById).not.toHaveBeenCalled();
  });
});
