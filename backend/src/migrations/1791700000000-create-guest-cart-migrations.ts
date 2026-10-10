import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGuestCartMigrations1791700000000 implements MigrationInterface {
  name = 'CreateGuestCartMigrations1791700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "guest_cart_migrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "migrationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guest_cart_migrations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_guest_cart_migrations_user_migration"
          UNIQUE ("userId", "migrationId"),
        CONSTRAINT "FK_guest_cart_migrations_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "guest_cart_migrations";');
  }
}
