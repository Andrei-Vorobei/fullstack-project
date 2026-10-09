import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from './entities/user-role.enum.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findUserByFilter: ReturnType<typeof vi.fn>;
    findUserById: ReturnType<typeof vi.fn>;
    findAllUsers: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    removeUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findUserByFilter: vi.fn(),
      findUserById: vi.fn(),
      findAllUsers: vi.fn(),
      updateUser: vi.fn(),
      removeUser: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns public profiles for all registered users', async () => {
      usersService.findAllUsers.mockResolvedValue([
        {
          id: 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49',
          username: 'alice',
          email: 'alice@example.com',
          password: 'hashed-password',
          yandexId: 'yandex-id',
          roles: [UserRole.USER],
          about: 'About Alice',
          avatar: 'https://example.com/avatar.png',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);

      const request = {
        user: { id: 'admin-id', username: 'admin', roles: [UserRole.USER] },
      } as Request & {
        user: { id: string; username: string; roles: UserRole[] };
      };

      await expect(controller.findAll(request)).resolves.toEqual([
        {
          id: 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49',
          username: 'alice',
          roles: [UserRole.USER],
          about: 'About Alice',
          avatar: 'https://example.com/avatar.png',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);
      expect(usersService.findAllUsers).toHaveBeenCalledOnce();
    });

    it('returns all user fields except password to administrators', async () => {
      const user = {
        id: 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        yandexId: 'yandex-id',
        roles: [UserRole.USER],
        about: 'About Alice',
        avatar: 'https://example.com/avatar.png',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      };
      const adminRequest = {
        user: { id: 'admin-id', username: 'admin', roles: [UserRole.ADMIN] },
      } as Request & {
        user: { id: string; username: string; roles: UserRole[] };
      };
      usersService.findAllUsers.mockResolvedValue([user]);

      await expect(controller.findAll(adminRequest)).resolves.toEqual([
        {
          id: user.id,
          username: user.username,
          email: user.email,
          yandexId: user.yandexId,
          roles: user.roles,
          about: user.about,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      ]);
    });
  });

  describe('updateMe', () => {
    const userId = 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49';
    const request = {
      user: { id: userId, username: 'alice', roles: [UserRole.USER] },
    } as Request & {
      user: { id: string; username: string; roles: UserRole[] };
    };

    it('updates the authenticated user and returns the safe profile', async () => {
      const user = { id: userId, username: 'alice' };
      const updatedUser = {
        id: userId,
        username: 'alice-new',
        email: 'alice@example.com',
        password: 'hashed-password',
        yandexId: null,
      };
      usersService.findUserById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(updatedUser);
      usersService.updateUser.mockResolvedValue({ affected: 1 });

      await expect(
        controller.updateMe(
          { username: 'alice-new', about: 'Updated profile' } as UpdateUserDto,
          request,
        ),
      ).resolves.toEqual({
        id: userId,
        username: 'alice-new',
        email: 'alice@example.com',
      });
      expect(usersService.updateUser).toHaveBeenCalledWith(userId, {
        username: 'alice-new',
        about: 'Updated profile',
      });
    });

    it('rejects a username that belongs to another user', async () => {
      usersService.findUserById.mockResolvedValue({
        id: userId,
        username: 'alice',
      });
      usersService.findUserByFilter.mockResolvedValue({
        id: 'b35796f4-6916-4dc6-af19-af2a469609d5',
        username: 'taken',
      });

      await expect(
        controller.updateMe({ username: 'taken' } as UpdateUserDto, request),
      ).rejects.toThrow(ConflictException);
      expect(usersService.updateUser).not.toHaveBeenCalled();
    });

    it('returns not found when the authenticated user no longer exists', async () => {
      usersService.findUserById.mockResolvedValue(null);

      await expect(
        controller.updateMe({ about: 'Updated profile' }, request),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMe', () => {
    const userId = 'ad27d56a-70c3-4ae4-bc6d-3b9da7b98b49';
    const request = {
      user: { id: userId, username: 'alice', roles: [UserRole.USER] },
    } as Request & {
      user: { id: string; username: string; roles: UserRole[] };
    };

    it('deletes the authenticated user account', async () => {
      usersService.findUserById.mockResolvedValue({
        id: userId,
        roles: [UserRole.USER],
      });
      usersService.removeUser.mockResolvedValue({ affected: 1 });

      await expect(
        controller.deleteMe(userId, request),
      ).resolves.toBeUndefined();
      expect(usersService.removeUser).toHaveBeenCalledWith(userId);
    });

    it('does not allow deleting another user account', async () => {
      await expect(
        controller.deleteMe('b35796f4-6916-4dc6-af19-af2a469609d5', request),
      ).rejects.toThrow(ForbiddenException);
      expect(usersService.removeUser).not.toHaveBeenCalled();
    });

    it('allows an admin to delete another user account', async () => {
      const adminRequest = {
        user: {
          id: userId,
          username: 'alice',
          roles: [UserRole.ADMIN],
        },
      } as Request & {
        user: { id: string; username: string; roles: UserRole[] };
      };
      const targetId = 'b35796f4-6916-4dc6-af19-af2a469609d5';
      usersService.findUserById.mockResolvedValue({
        id: targetId,
        roles: [UserRole.USER],
      });
      usersService.removeUser.mockResolvedValue({ affected: 1 });

      await expect(
        controller.deleteMe(targetId, adminRequest),
      ).resolves.toBeUndefined();
      expect(usersService.removeUser).toHaveBeenCalledWith(targetId);
    });

    it('does not allow deleting an administrator account', async () => {
      const targetId = 'b35796f4-6916-4dc6-af19-af2a469609d5';
      const adminRequest = {
        user: { id: userId, username: 'alice', roles: [UserRole.ADMIN] },
      } as Request & {
        user: { id: string; username: string; roles: UserRole[] };
      };
      usersService.findUserById.mockResolvedValue({
        id: targetId,
        roles: [UserRole.ADMIN],
      });

      await expect(controller.deleteMe(targetId, adminRequest)).rejects.toThrow(
        ForbiddenException,
      );
      expect(usersService.removeUser).not.toHaveBeenCalled();
    });

    it('returns not found when the user does not exist', async () => {
      usersService.findUserById.mockResolvedValue(null);

      await expect(controller.deleteMe(userId, request)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.removeUser).not.toHaveBeenCalled();
    });

    it('returns not found when the account disappears during deletion', async () => {
      usersService.findUserById.mockResolvedValue({
        id: userId,
        roles: [UserRole.USER],
      });
      usersService.removeUser.mockResolvedValue({ affected: 0 });

      await expect(controller.deleteMe(userId, request)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
