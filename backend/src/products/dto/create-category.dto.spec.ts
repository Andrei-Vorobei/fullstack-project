import { validate } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto.js';

describe('CreateCategoryDto', () => {
  it('accepts a Russian display name and a lowercase Latin slug', async () => {
    const dto = Object.assign(new CreateCategoryDto(), {
      name: '\u0410\u043a\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044b \u0434\u043b\u044f \u0434\u043e\u043c\u0430',
      slug: 'aksessuary-dlya-doma',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects a non-Russian name and a non-Latin slug', async () => {
    const dto = Object.assign(new CreateCategoryDto(), {
      name: 'Home decor',
      slug: '\u0434\u043e\u043c',
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['name', 'slug']),
    );
  });
});
