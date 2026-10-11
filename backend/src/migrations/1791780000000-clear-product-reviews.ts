import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ClearProductReviews1791780000000 implements MigrationInterface {
  name = 'ClearProductReviews1791780000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "reviews"');
  }

  async down(): Promise<void> {
    // Deleted legacy reviews cannot be reconstructed.
  }
}
