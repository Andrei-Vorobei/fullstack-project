import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductTags1791760000000 implements MigrationInterface {
  name = 'DropProductTags1791760000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "tags"');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE \"products\" ADD COLUMN \"tags\" text array NOT NULL DEFAULT '{}'",
    );
  }
}
