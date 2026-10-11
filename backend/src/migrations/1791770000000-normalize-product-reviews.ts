import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeProductReviews1791770000000 implements MigrationInterface {
  name = 'NormalizeProductReviews1791770000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "productId" uuid NOT NULL, "userId" uuid, "rating" double precision NOT NULL, "comment" text NOT NULL, "date" TIMESTAMPTZ NOT NULL, "reviewerName" character varying(255) NOT NULL, CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id"), CONSTRAINT "CHK_reviews_rating_range" CHECK ("rating" >= 0 AND "rating" <= 5), CONSTRAINT "FK_reviews_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE, CONSTRAINT "FK_reviews_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_reviews_productId" ON "reviews" ("productId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_reviews_userId" ON "reviews" ("userId")',
    );
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "reviews"');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN "reviews" jsonb NOT NULL DEFAULT \'[]\'::jsonb',
    );
    await queryRunner.query('DROP TABLE "reviews"');
  }
}
