import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '#src/users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './local.strategy.js';
import { YandexStrategy } from './yandex.strategy.js';
import { OAuthController } from './oauth.controller.js';
import { ACCESS_TOKEN_TTL } from './auth.constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'local' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        if (!configService.getOrThrow<string>('JWT_REFRESH_SECRET').trim()) {
          throw new Error('JWT_REFRESH_SECRET must not be empty');
        }

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn: ACCESS_TOKEN_TTL },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, YandexStrategy],
  exports: [AuthService],
})
export class AuthModule {}
