import type { MigrationInterface, QueryRunner } from 'typeorm';

import { CATEGORY_NAMES } from '../products/category-names.js';

export class LocalizeCategoryNames1791740000000 implements MigrationInterface {
  name = 'LocalizeCategoryNames1791740000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
      await queryRunner.query(
        'UPDATE "categories" SET "name" = $1 WHERE "slug" = $2',
        [name, slug],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const slug of Object.keys(CATEGORY_NAMES)) {
      await queryRunner.query(
        'UPDATE "categories" SET "name" = $1 WHERE "slug" = $2',
        [slug, slug],
      );
    }
  }
}
