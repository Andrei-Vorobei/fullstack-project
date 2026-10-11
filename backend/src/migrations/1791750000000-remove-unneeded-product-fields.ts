import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnneededProductFields1791750000000 implements MigrationInterface {
  name = 'RemoveUnneededProductFields1791750000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN "warrantyInformation", DROP COLUMN "shippingInformation", DROP COLUMN "returnPolicy", DROP COLUMN "minimumOrderQuantity"',
    );
    await queryRunner.query(`
      UPDATE "products"
      SET "meta" = COALESCE("meta", '{}'::jsonb) - 'barcode' - 'qrCode'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "warrantyInformation" text NOT NULL DEFAULT '',
        ADD COLUMN "shippingInformation" text NOT NULL DEFAULT '',
        ADD COLUMN "returnPolicy" text NOT NULL DEFAULT '',
        ADD COLUMN "minimumOrderQuantity" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      UPDATE "products"
      SET "meta" = COALESCE("meta", '{}'::jsonb) || '{"barcode":"","qrCode":""}'::jsonb
    `);
  }
}
