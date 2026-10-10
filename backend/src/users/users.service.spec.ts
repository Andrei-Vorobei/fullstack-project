import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.enum.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const userRepository = {
    findOneBy: vi.fn(),
    save: vi.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
