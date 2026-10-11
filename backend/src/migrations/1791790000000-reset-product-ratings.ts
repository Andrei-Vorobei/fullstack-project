import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetProductRatings1791790000000 implements MigrationInterface {
  name = 'ResetProductRatings1791790000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE "products" SET "rating" = 0');
  }

  async down(): Promise<void> {
    // Previous ratings cannot be reconstructed without their source reviews.
  }
}
