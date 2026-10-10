import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCurrencies1791730000000 implements MigrationInterface {
  name = 'AddProductCurrencies1791730000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "currencies" (
        "code" character varying(3) NOT NULL,
        "name" character varying(64) NOT NULL,
        "symbol" character varying(8) NOT NULL,
        CONSTRAINT "PK_currencies_code" PRIMARY KEY ("code")
      );

      INSERT INTO "currencies" ("code", "name", "symbol") VALUES
        ('USD', 'Доллар США', '$'),
        ('EUR', 'Евро', '€'),
        ('RUB', 'Российский рубль', '₽');

      ALTER TABLE "products"
        ADD COLUMN "currencyCode" character varying(3) NOT NULL DEFAULT 'USD';

      ALTER TABLE "products"
        ADD CONSTRAINT "FK_products_currencyCode"
        FOREIGN KEY ("currencyCode") REFERENCES "currencies"("code")
        ON UPDATE CASCADE ON DELETE RESTRICT;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP CONSTRAINT "FK_products_currencyCode";
      ALTER TABLE "products" DROP COLUMN "currencyCode";
      DROP TABLE "currencies";
    `);
  }
}
