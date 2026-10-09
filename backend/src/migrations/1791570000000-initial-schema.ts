import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791570000000 implements MigrationInterface {
  name = 'InitialSchema1791570000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "users_roles_enum" AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "yandexId" character varying(255),
        "username" character varying NOT NULL,
        "roles" "users_roles_enum" array NOT NULL DEFAULT ARRAY['user']::"users_roles_enum"[],
        "about" character varying(200) NOT NULL DEFAULT 'Пока ничего не рассказал о себе',
        "avatar" character varying(500) NOT NULL DEFAULT 'https://i.pravatar.cc/300',
        "email" character varying(255) NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_yandexId" UNIQUE ("yandexId"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "externalId" integer,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "category" character varying(100) NOT NULL,
        "price" double precision NOT NULL,
        "discountPercentage" double precision NOT NULL,
        "rating" double precision NOT NULL,
        "stock" integer NOT NULL,
        "tags" text array NOT NULL DEFAULT '{}',
        "brand" character varying(255),
        "sku" character varying(100) NOT NULL,
        "weight" double precision NOT NULL,
        "dimensions" jsonb NOT NULL,
        "warrantyInformation" text NOT NULL,
        "shippingInformation" text NOT NULL,
        "availabilityStatus" character varying(100) NOT NULL,
        "reviews" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "returnPolicy" text NOT NULL,
        "minimumOrderQuantity" integer NOT NULL,
        "meta" jsonb NOT NULL,
        "images" text array NOT NULL DEFAULT '{}',
        "thumbnail" text NOT NULL,
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_externalId" UNIQUE ("externalId"),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku")
      );

      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carts_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_carts_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cartId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_items_cartId" FOREIGN KEY ("cartId")
          REFERENCES "carts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_items_productId" FOREIGN KEY ("productId")
          REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_cart_items_cartId_productId" UNIQUE ("cartId", "productId"),
        CONSTRAINT "CHK_cart_items_quantity_positive" CHECK ("quantity" > 0)
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "cart_items";
      DROP TABLE IF EXISTS "carts";
      DROP TABLE IF EXISTS "products";
      DROP TABLE IF EXISTS "users";
      DROP TYPE IF EXISTS "users_roles_enum";
    `);
  }
}
