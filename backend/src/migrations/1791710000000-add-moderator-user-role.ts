import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModeratorUserRole1791710000000 implements MigrationInterface {
  name = 'AddModeratorUserRole1791710000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "users_roles_enum" ADD VALUE IF NOT EXISTS 'moderator';`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT;
      ALTER TABLE "users" ALTER COLUMN "roles" TYPE text[] USING "roles"::text[];
      UPDATE "users" SET "roles" = array_remove("roles", 'moderator');
      DROP TYPE "users_roles_enum";
      CREATE TYPE "users_roles_enum" AS ENUM ('user', 'admin');
      ALTER TABLE "users"
        ALTER COLUMN "roles" TYPE "users_roles_enum"[]
        USING "roles"::"users_roles_enum"[];
      ALTER TABLE "users"
        ALTER COLUMN "roles" SET DEFAULT ARRAY['user']::"users_roles_enum"[];
    `);
  }
}
