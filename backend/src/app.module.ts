import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './users/entities/user.entity.js';
import { APP_FILTER } from '@nestjs/core';
import { ServerExceptionFilter } from './filter/server-exception.filter.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';
import { Product } from './products/entities/products.entity.js';
import { Review } from './products/entities/review.entity.js';
import { Cart } from './cart/entities/cart.entity.js';
import { CartItem } from './cart/entities/cart-item.entity.js';
import { GuestCartMigration } from './cart/entities/guest-cart-migration.entity.js';
import { CartModule } from './cart/cart.module.js';
import { InitialSchema1791570000000 } from './migrations/1791570000000-initial-schema.js';
import { Category } from './products/entities/category.entity.js';
import { CreateCategories1791633600000 } from './migrations/1791633600000-create-categories.js';
import { CreateGuestCartMigrations1791700000000 } from './migrations/1791700000000-create-guest-cart-migrations.js';
import { AddModeratorUserRole1791710000000 } from './migrations/1791710000000-add-moderator-user-role.js';
import { AddTelegramUsername1791720000000 } from './migrations/1791720000000-add-telegram-username.js';
import { Currency } from './currencies/entities/currency.entity.js';
import { CurrenciesModule } from './currencies/currencies.module.js';
import { AddProductCurrencies1791730000000 } from './migrations/1791730000000-add-product-currencies.js';
import { LocalizeCategoryNames1791740000000 } from './migrations/1791740000000-localize-category-names.js';
import { RemoveUnneededProductFields1791750000000 } from './migrations/1791750000000-remove-unneeded-product-fields.js';
import { DropProductTags1791760000000 } from './migrations/1791760000000-drop-product-tags.js';
import { NormalizeProductReviews1791770000000 } from './migrations/1791770000000-normalize-product-reviews.js';
import { ClearProductReviews1791780000000 } from './migrations/1791780000000-clear-product-reviews.js';
import { ResetProductRatings1791790000000 } from './migrations/1791790000000-reset-product-ratings.js';
import { AddReviewUpdatedAt1791800000000 } from './migrations/1791800000000-add-review-updated-at.js';
import { MakeProductSkuOptional1791810000000 } from './migrations/1791810000000-make-product-sku-optional.js';
import { OAuthSessionStore } from './auth/oauth-session.store.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'error.log',
          level: 'error',
          format: winston.format.json(),
        }),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = Number(configService.getOrThrow<string>('DB_PORT'));

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('DB_PORT must be an integer between 1 and 65535');
        }

        return {
          type: 'postgres' as const,
          uuidExtension: 'pgcrypto' as const,
          host: configService.getOrThrow<string>('DB_HOST'),
          port,
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_DATABASE'),
          entities: [
            User,
            Product,
            Review,
            Cart,
            CartItem,
            Category,
            GuestCartMigration,
            Currency,
          ],
          migrations: [
            InitialSchema1791570000000,
            CreateCategories1791633600000,
            CreateGuestCartMigrations1791700000000,
            AddModeratorUserRole1791710000000,
            AddTelegramUsername1791720000000,
            AddProductCurrencies1791730000000,
            LocalizeCategoryNames1791740000000,
            RemoveUnneededProductFields1791750000000,
            DropProductTags1791760000000,
            NormalizeProductReviews1791770000000,
            ClearProductReviews1791780000000,
            ResetProductRatings1791790000000,
            AddReviewUpdatedAt1791800000000,
            MakeProductSkuOptional1791810000000,
          ],
          migrationsRun: true,
          installExtensions: false,
          toLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CurrenciesModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppService,
    OAuthSessionStore,
    {
      provide: APP_FILTER,
      useClass: ServerExceptionFilter,
    },
  ],
})
export class AppModule {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    logger.log('info', 'AppModule запущен.');
  }
}
