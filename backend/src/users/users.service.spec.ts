import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.enum.js';
import { UsersService } from './users.service.js';
import type { Profile } from 'passport-yandex';
import { DEFAULT_USER_AVATAR } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  const transactionRepository = {
    findOneBy: vi.fn(),
    create: vi.fn((user) => user),
    save: vi.fn((user) => Promise.resolve(user)),
  };
  const transactionManager = {
    getRepository: vi.fn(() => transactionRepository),
  };
  const userRepository = {
    findOneBy: vi.fn(),
    save: vi.fn(),
    manager: {
      transaction: vi.fn((callback) => callback(transactionManager)),
    },
  };
  const yandexProfile: Profile = {
    provider: 'yandex',
    id: 'yandex-user-id',
    displayName: 'Yandex User',
    name: {},
    emails: [{ value: 'yandex@example.com' }],
    photos: [{ value: 'https://avatars.yandex.net/avatar.png', type: 'thumbnail' }],
    _raw: '',
    _json: { id: 'yandex-user-id' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: Logger, useValue: { error: vi.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
    transactionRepository.create.mockImplementation((user) => user);
    transactionRepository.save.mockImplementation((user) => Promise.resolve(user));
    userRepository.manager.transaction.mockImplementation((callback) =>
      callback(transactionManager),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Yandex avatar synchronization', () => {
    it('saves the Yandex avatar when creating a user', async () => {
      transactionRepository.findOneBy.mockResolvedValue(null);

      const user = await service.createFromYandex(yandexProfile);

      expect(user.avatar).toBe('https://avatars.yandex.net/avatar.png');
      expect(transactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          yandexId: 'yandex-user-id',
          avatar: 'https://avatars.yandex.net/avatar.png',
        }),
      );
    });

    it('adds the Yandex avatar to a linked account that still has the default', async () => {
      const linkedUser = {
        yandexId: null,
        email: 'yandex@example.com',
        avatar: DEFAULT_USER_AVATAR,
      };
      transactionRepository.findOneBy.mockResolvedValue(linkedUser);

      const user = await service.createFromYandex(yandexProfile);

      expect(user.avatar).toBe('https://avatars.yandex.net/avatar.png');
      expect(user.yandexId).toBe('yandex-user-id');
    });

    it('does not replace a user-selected avatar', async () => {
      const user = {
        avatar: 'https://example.com/custom-avatar.png',
      } as User;

      await expect(
        service.updateYandexAvatar(user, yandexProfile),
      ).resolves.toBe(user);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('updates a previously linked account while it still has the default avatar', async () => {
      const user = {
        avatar: DEFAULT_USER_AVATAR,
      } as User;
      userRepository.save.mockImplementation((savedUser) =>
        Promise.resolve(savedUser),
      );

      await expect(
        service.updateYandexAvatar(user, yandexProfile),
      ).resolves.toMatchObject({
        avatar: 'https://avatars.yandex.net/avatar.png',
      });
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('setModeratorRole', () => {
    const user = {
      id: 'b35796f4-6916-4dc6-af19-af2a469609d5',
      roles: [UserRole.USER],
    };

    it('adds moderator without removing existing roles', async () => {
      userRepository.findOneBy.mockResolvedValue({ ...user, roles: [...user.roles] });
      userRepository.save.mockImplementation((updatedUser) => Promise.resolve(updatedUser));

      await expect(
        service.setModeratorRole(user.id, true),
      ).resolves.toEqual({
        ...user,
        roles: [UserRole.USER, UserRole.MODERATOR],
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        roles: [UserRole.USER, UserRole.MODERATOR],
      });
    });

    it('removes moderator without removing other roles', async () => {
      const moderator = {
        ...user,
        roles: [UserRole.USER, UserRole.MODERATOR],
      };
      userRepository.findOneBy.mockResolvedValue(moderator);
      userRepository.save.mockImplementation((updatedUser) => Promise.resolve(updatedUser));

      await expect(
        service.setModeratorRole(user.id, false),
      ).resolves.toEqual(user);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('does not save when the role already has the requested state', async () => {
      userRepository.findOneBy.mockResolvedValue(user);

      await expect(service.setModeratorRole(user.id, false)).resolves.toBe(user);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('returns null when the target user does not exist', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.setModeratorRole(user.id, true)).resolves.toBeNull();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
