import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewUpdatedAt1791800000000 implements MigrationInterface {
  name = 'AddReviewUpdatedAt1791800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reviews" ADD COLUMN "updatedAt" TIMESTAMPTZ',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reviews" DROP COLUMN "updatedAt"',
    );
  }
}
