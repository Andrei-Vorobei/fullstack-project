import type { MigrationInterface, QueryRunner } from 'typeorm';

const categories = [
  'beauty',
  'fragrances',
  'furniture',
  'groceries',
  'home-decoration',
  'kitchen-accessories',
  'laptops',
  'mens-shirts',
  'mens-shoes',
  'mens-watches',
  'mobile-accessories',
  'motorcycle',
  'skin-care',
  'smartphones',
  'sports-accessories',
  'sunglasses',
  'tablets',
  'tops',
  'vehicle',
  'womens-bags',
  'womens-dresses',
  'womens-jewellery',
  'womens-shoes',
  'womens-watches',
];

export class CreateCategories1791633600000 implements MigrationInterface {
  name = 'CreateCategories1791633600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "slug" character varying(100) NOT NULL,
        "name" character varying(100) NOT NULL,
        CONSTRAINT "PK_categories_slug" PRIMARY KEY ("slug")
      );
    `);

    for (const slug of categories) {
      await queryRunner.query(
        `
          INSERT INTO "categories" ("slug", "name")
          VALUES ($1, $2)
          ON CONFLICT ("slug") DO NOTHING
        `,
        [slug, slug],
      );
    }

    await queryRunner.query(`
      INSERT INTO "categories" ("slug", "name")
      SELECT DISTINCT "category", "category"
      FROM "products"
      WHERE "category" IS NOT NULL
      ON CONFLICT ("slug") DO NOTHING;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_products_category'
            AND conrelid = '"products"'::regclass
        ) THEN
          ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_category"
            FOREIGN KEY ("category") REFERENCES "categories"("slug")
            ON UPDATE CASCADE ON DELETE RESTRICT;
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP CONSTRAINT IF EXISTS "FK_products_category";
      DROP TABLE IF EXISTS "categories";
    `);
  }
}
