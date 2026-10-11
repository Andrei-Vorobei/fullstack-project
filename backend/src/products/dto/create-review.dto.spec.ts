import { validate } from 'class-validator';
import { CreateReviewDto } from './create-review.dto.js';

describe('CreateReviewDto', () => {
  it('accepts an integer rating from one to five and a non-empty comment', async () => {
    const dto = Object.assign(new CreateReviewDto(), {
      rating: 5,
      comment: 'Good quality',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects out-of-range ratings and whitespace-only comments', async () => {
    const dto = Object.assign(new CreateReviewDto(), {
      rating: 0,
      comment: '   ',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['rating', 'comment']),
    );
  });
});
