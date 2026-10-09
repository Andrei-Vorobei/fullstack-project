import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { UsersService } from '#src/users/users.service.js';
import { User } from '#src/users/entities/user.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(jwtPayload: {
    sub: string;
    tokenType?: string;
  }): Promise<User> {
    if (jwtPayload.tokenType && jwtPayload.tokenType !== 'access') {
      throw new UnauthorizedException('Некорректный JWT');
    }

    if (!isUUID(jwtPayload.sub)) {
      throw new UnauthorizedException('Некорректный JWT');
    }

    const user = await this.usersService.findUserById(jwtPayload.sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }
}
