import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindOptionsWhere,
  ILike,
  Repository,
  UpdateResult,
} from 'typeorm';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Profile } from 'passport-yandex';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger,
  ) {}

  async findUserByFilter(filter: Record<string, unknown>) {
    return this.userRepository.findOneBy(filter);
  }

  async findUserById(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Универсальный поиск по нескольким условиям.
  async findMany(criteria: FindOptionsWhere<User>[]): Promise<User[]> {
    return this.userRepository.find({
      where: criteria,
    });
  }

  // Поиск по части username или email без учёта регистра.
  async findManyBySearch(query: string): Promise<User[]> {
    const value = query.trim();

    return this.findMany([
      { username: ILike(`%${value}%`) },
      { email: ILike(`%${value}%`) },
    ]);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...dto,
      roles: [UserRole.USER],
      password: await bcrypt.hash(dto.password, 10),
    });

    return this.userRepository.save(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UpdateResult> {
    const updateData: UpdateUserDto = { ...dto };

    if (updateData.telegramUsername !== undefined) {
      updateData.telegramUsername = updateData.telegramUsername?.trim().replace(/^@/, '') || null;
    }

    // Пароль из PATCH /users/me никогда не должен попасть в БД открытым текстом.
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    try {
      return await this.userRepository.update({ id }, updateData);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'Такой username или email уже используется',
        );
      }

      throw error;
    }
  }

  async setModeratorRole(id: string, enabled: boolean): Promise<User | null> {
    const user = await this.findUserById(id);
    if (!user) return null;

    const hasModeratorRole = user.roles.includes(UserRole.MODERATOR);
    if (enabled === hasModeratorRole) return user;

    user.roles = enabled
      ? [...user.roles, UserRole.MODERATOR]
      : user.roles.filter((role) => role !== UserRole.MODERATOR);

    return this.userRepository.save(user);
  }

  async removeUser(id: string): Promise<DeleteResult> {
    return this.userRepository.delete({ id });
  }

  async findByYandexID(yandexId: string) {
    return this.userRepository.findOneBy({ yandexId });
  }

  async createFromYandex(profile: Profile): Promise<User> {
    const { id, displayName, emails } = profile;

    const email = emails?.[0]?.value ?? null;

    if (!email || !isEmail(email)) {
      throw new BadRequestException('Некорректный или отсутствующий email');
    }

    return this.userRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const existingUser = await repository.findOneBy({ email });

      if (existingUser) {
        existingUser.yandexId = id;
        return repository.save(existingUser);
      }

      try {
        return await repository.save(
          repository.create({
            yandexId: id,
            username: displayName || `yandex_user_${id}`,
            email,
            roles: [UserRole.USER],
            password: await bcrypt.hash(`yandex:${id}`, 10),
          }),
        );
      } catch (error: unknown) {
        this.logger.error('Ошибка сохранения пользователя через Yandex');

        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === '23505'
        ) {
          throw new ConflictException(
            'Пользователь с таким email уже существует',
          );
        }

        throw error;
      }
    });
  }
}
