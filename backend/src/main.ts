import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { OAuthSessionStore } from './auth/oauth-session.store.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const oauthSessionStore = app.get(OAuthSessionStore);

  app.use(
    session({
      name: 'oauth.sid',
      secret: oauthSessionStore.secret,
      store: oauthSessionStore.store,
      resave: false,
      saveUninitialized: false,
      proxy: oauthSessionStore.isProduction,
      cookie: {
        httpOnly: true,
        secure: oauthSessionStore.isProduction,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
      },
    }),
  );

  const allowedOrigins = configService
    .get<string>('FRONTEND_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableShutdownHooks();
  await app.listen(3000);
}
void bootstrap().catch((error: unknown) => {
  const reason =
    error instanceof Error
      ? (error.stack ?? error.message)
      : typeof error === 'string'
        ? error
        : 'Unknown startup error';
  process.stderr.write(`Application failed to start: ${reason}\n`);
  process.exitCode = 1;
});
