import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelegramUsername1791720000000 implements MigrationInterface {
  name = 'AddTelegramUsername1791720000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "telegramUsername" character varying(32);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "telegramUsername";
    `);
  }
}
