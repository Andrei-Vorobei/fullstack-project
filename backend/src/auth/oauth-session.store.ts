import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import session from 'express-session';

const OAuthSession = connectPgSimple(session);

@Injectable()
export class OAuthSessionStore implements OnModuleDestroy {
  readonly store: session.Store;
  readonly secret: string;
  readonly isProduction: boolean;
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('SESSION_SECRET').trim();
    if (this.secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long');
    }

    this.isProduction =
      configService.get<string>('NODE_ENV') === 'production';
    this.pool = new Pool({
      host: configService.getOrThrow<string>('DB_HOST'),
      port: Number(configService.getOrThrow<string>('DB_PORT')),
      user: configService.getOrThrow<string>('DB_USERNAME'),
      password: configService.getOrThrow<string>('DB_PASSWORD'),
      database: configService.getOrThrow<string>('DB_DATABASE'),
    });
    this.store = new OAuthSession({
      pool: this.pool,
      tableName: 'oauth_sessions',
      createTableIfMissing: true,
      ttl: 10 * 60,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
