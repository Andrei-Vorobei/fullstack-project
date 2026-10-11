import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProductSkuOptional1791810000000 implements MigrationInterface {
  name = 'MakeProductSkuOptional1791810000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE \"products\" SET \"sku\" = 'CUSTOM-' || \"id\" WHERE \"sku\" IS NULL",
    );
    await queryRunner.query(
      'ALTER TABLE "products" ALTER COLUMN "sku" SET NOT NULL',
    );
  }
}
