import { readFile } from 'node:fs/promises';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/products.entity.js';
import { Review } from './entities/review.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/entities/user-role.enum.js';
import { ProductsService } from './products.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { getCategoryName } from './category-names.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Pick<
    Repository<Product>,
    | 'findAndCount'
    | 'create'
    | 'save'
    | 'upsert'
    | 'findOneBy'
    | 'findOne'
    | 'remove'
    | 'createQueryBuilder'
  >;
  let categoriesRepository: Pick<
    Repository<Category>,
    'find' | 'findOneBy' | 'save'
  >;
  let reviewsRepository: Pick<Repository<Review>, 'create' | 'save' | 'find' | 'findOne' | 'remove'>;
  let usersRepository: Pick<Repository<User>, 'findOneBy'>;

  beforeEach(async () => {
    productsRepository = {
      findAndCount: vi.fn(),
      create: vi.fn((product) => ({ ...product })),
      save: vi.fn(async (product) => product),
      upsert: vi.fn(),
      findOneBy: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn(async (product) => product),
      createQueryBuilder: vi.fn(),
    };
    categoriesRepository = {
      find: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(async (category) => category as Category),
    };
    reviewsRepository = { create: vi.fn((review) => ({ ...review, id: 'review-id' })), save: vi.fn(async (review) => review as Review), find: vi.fn(), findOne: vi.fn(), remove: vi.fn(async (review) => review) };
    usersRepository = { findOneBy: vi.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns categories ordered by display name', async () => {
    vi.mocked(categoriesRepository.find).mockResolvedValue([
      { slug: 'beauty', name: 'Красота' },
      {
        slug: 'fragrances',
        name: 'Парфюмерия',
      },
    ] as Category[]);

    await expect(service.getCategories()).resolves.toEqual([
      { slug: 'beauty', name: 'Красота' },
      {
        slug: 'fragrances',
        name: 'Парфюмерия',
      },
    ]);
    expect(categoriesRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('uses Russian names for known category slugs and preserves unknown names', () => {
    expect(getCategoryName('beauty')).toBe('Красота');
    expect(getCategoryName('electronics')).toBe('electronics');
  });

  it('creates a category using the supplied slug and Russian display name', async () => {
    vi.mocked(categoriesRepository.findOneBy).mockResolvedValue(null);
    const category = {
      slug: 'new-category',
      name: 'Для красоты',
    } as Category;
    vi.mocked(categoriesRepository.save).mockResolvedValue(category);

    await expect(
      service.createCategory({
        slug: 'new-category',
        name: ' Для   красоты ',
      } as CreateCategoryDto),
    ).resolves.toBe(category);
    expect(categoriesRepository.findOneBy).toHaveBeenCalledWith({
      slug: 'new-category',
    });
    expect(categoriesRepository.save).toHaveBeenCalledWith({
      slug: 'new-category',
      name: 'Для красоты',
    });
  });

  it('rejects duplicate category slugs', async () => {
    vi.mocked(categoriesRepository.findOneBy).mockResolvedValue({
      slug: 'beauty',
      name: 'Красота',
    } as Category);

    await expect(
      service.createCategory({
        slug: 'beauty',
        name: 'Красота',
      } as CreateCategoryDto),
    ).rejects.toThrow('Категория с таким slug уже существует');
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('returns all products and defaults the limit to the total count', async () => {
    const products = [{ externalId: 1 }] as Product[];
    vi.mocked(productsRepository.findAndCount).mockResolvedValue([
      products,
      194,
    ]);

    await expect(service.getProductsAll()).resolves.toEqual({
      products,
      total: 194,
      skip: 0,
      limit: 194,
    });
    expect(productsRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      order: { externalId: 'ASC' },
      relations: { reviews: true },
    });
  });

  it('applies the requested pagination', async () => {
    vi.mocked(productsRepository.findAndCount).mockResolvedValue([[], 194]);

    await expect(service.getProductsAll(20, 10)).resolves.toEqual({
      products: [],
      total: 194,
      skip: 20,
      limit: 10,
    });
    expect(productsRepository.findAndCount).toHaveBeenCalledWith({
      skip: 20,
      take: 10,
      order: { externalId: 'ASC' },
      relations: { reviews: true },
    });
  });

  it('rejects invalid pagination values', async () => {
    await expect(service.getProductsAll(-1)).rejects.toThrow(
      'Смещение должно быть неотрицательным целым числом',
    );
    await expect(service.getProductsAll(0, 0)).rejects.toThrow(
      'положительным целым числом',
    );
  });

  it.each([
    [true, 'product.stock > 0'],
    [false, 'product.stock <= 0'],
  ])(
    'filters products by stock availability (%s)',
    async (inStock, condition) => {
      const query = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };
      vi.mocked(productsRepository.createQueryBuilder).mockReturnValue(
        query as never,
      );

      await service.getFilteredProducts({ inStock });

      expect(query.andWhere).toHaveBeenCalledWith(condition);
    },
  );

  it('paginates filtered products and returns the total matching count', async () => {
    const products = [{ externalId: 11 }] as Product[];
    const query = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([products, 21]),
    };
    vi.mocked(productsRepository.createQueryBuilder).mockReturnValue(
      query as never,
    );

    await expect(
      service.getFilteredProducts({ category: 'beauty' }, 10, 5),
    ).resolves.toEqual({
      products,
      total: 21,
      skip: 10,
      limit: 5,
    });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.take).toHaveBeenCalledWith(5);
    expect(query.getManyAndCount).toHaveBeenCalledOnce();
  });

  it('does nothing when the products JSON file does not exist', async () => {
    vi.mocked(readFile).mockRejectedValue(
      Object.assign(new Error('File not found'), { code: 'ENOENT' }),
    );

    await expect(service.importFromJson()).resolves.toEqual({
      fileFound: false,
      imported: 0,
    });
    expect(productsRepository.upsert).not.toHaveBeenCalled();
  });

  it('imports products from the JSON file', async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        products: [
          {
            id: 42,
            title: 'Test product',
            sku: 'TEST-42',
            rating: 4.8,
            reviews: [{ reviewerName: 'fake author', reviewerEmail: 'fake@example.com', rating: 5, comment: 'Legacy data' }],
          },
        ],
      }) as never,
    );

    await expect(service.importFromJson()).resolves.toEqual({
      fileFound: true,
      imported: 1,
    });
    expect(productsRepository.upsert).toHaveBeenCalledWith(
      [
        {
          title: 'Test product',
          sku: 'TEST-42',
          currencyCode: 'USD',
          externalId: 42,
          rating: 0,
        },
      ],
      ['externalId'],
    );
    expect(reviewsRepository.save).not.toHaveBeenCalled();
  });

  it('creates a product in the repository', async () => {
    const payload = {
      title: 'Laptop',
      description: 'Gaming laptop',
      category: 'electronics',
      brand: 'BrandX',
      price: 999,
      stock: 12,
      images: ['https://example.com/laptop.webp'],
    } satisfies CreateProductDto;

    vi.mocked(categoriesRepository.findOneBy).mockResolvedValue(null);
    const createdProduct = await service.createProduct(payload);
    const repositoryInput = vi.mocked(productsRepository.create).mock
      .calls[0][0];

    expect(repositoryInput).toEqual(
      expect.objectContaining({
        ...payload,
        currencyCode: 'USD',
        discountPercentage: 0,
        rating: 0,
        availabilityStatus: 'In Stock',
        thumbnail: payload.images[0],
        externalId: null,
        meta: expect.objectContaining({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      }),
    );
    expect(repositoryInput.sku).toMatch(/^CUSTOM-[0-9a-f-]{36}$/i);
    expect(categoriesRepository.findOneBy).toHaveBeenCalledWith({
      slug: 'electronics',
    });
    expect(categoriesRepository.save).toHaveBeenCalledWith({
      slug: 'electronics',
      name: 'electronics',
    });
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining(repositoryInput));
    expect(createdProduct).toEqual(
      expect.objectContaining({ availabilityStatus: 'В наличии' }),
    );
  });

  it('preserves supported fields from a pasted product object but generates database identifiers', async () => {
    const payload = {
      id: 'fe43d117-4705-42e1-ab2c-851d16059239',
      externalId: 2,
      title: 'Eyeshadow Palette with Mirror',
      description: 'A versatile eyeshadow palette.',
      category: 'beauty',
      brand: 'Glamour Beauty',
      price: 19.99,
      currencyCode: 'EUR',
      discountPercentage: 18.19,
      stock: 34,
      sku: 'BEA-GLA-EYE-002',
      weight: 9,
      dimensions: { depth: 27.67, width: 9.26, height: 22.47 },
      availabilityStatus: 'In Stock',
      meta: {
        createdAt: '2024-12-03T11:29:45.706Z',
        updatedAt: '2025-08-24T16:52:47.806Z',
      },
      images: ['https://example.com/product.webp'],
      thumbnail: 'https://example.com/thumbnail.webp',
    } satisfies CreateProductDto;

    await service.createProduct(payload);
    const repositoryInput = vi.mocked(productsRepository.create).mock
      .calls[0][0];

    expect(repositoryInput).toEqual(
      expect.objectContaining({
        title: payload.title,
        externalId: null,
        sku: payload.sku,
        currencyCode: payload.currencyCode,
        discountPercentage: payload.discountPercentage,
        rating: 0,
        dimensions: payload.dimensions,
        meta: payload.meta,
        thumbnail: payload.thumbnail,
      }),
    );
    expect(repositoryInput).not.toHaveProperty('id');
    expect(repositoryInput).not.toHaveProperty('reviews');
  });

  it('deletes a product that is not in any cart', async () => {
    const product = { id: 'product-id', cartItems: [] } as Product;
    vi.mocked(productsRepository.findOne).mockResolvedValue(product);

    await expect(service.deleteProduct('product-id')).resolves.toBeUndefined();
    expect(productsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      relations: { cartItems: true },
    });
    expect(productsRepository.remove).toHaveBeenCalledWith(product);
  });

  it('rejects deleting a product that is still in a cart', async () => {
    vi.mocked(productsRepository.findOne).mockResolvedValue({
      id: 'product-id',
      cartItems: [{ id: 'cart-item-id' }],
    } as Product);

    await expect(service.deleteProduct('product-id')).rejects.toThrow();
    expect(productsRepository.remove).not.toHaveBeenCalled();
  });

  it('throws when deleting a product that does not exist', async () => {
    vi.mocked(productsRepository.findOne).mockResolvedValue(null);

    await expect(service.deleteProduct('missing-product')).rejects.toThrow();
    expect(productsRepository.remove).not.toHaveBeenCalled();
  });

  it('creates a review linked to the product and authenticated user', async () => {
    const product = { id: 'product-id', reviews: [{ rating: 3 }] } as Product;
    const user = { id: 'user-id', username: 'alice' } as User;
    vi.mocked(productsRepository.findOne).mockResolvedValue(product);
    vi.mocked(usersRepository.findOneBy).mockResolvedValue(user);

    await expect(
      service.createReview('product-id', 'user-id', { rating: 5, comment: '  Great!  ' }),
    ).resolves.toMatchObject({
      id: 'review-id', rating: 5, comment: 'Great!', reviewerName: 'alice',
    });
    expect(reviewsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ product, user, rating: 5, comment: 'Great!', reviewerName: 'alice', date: expect.any(Date) }),
    );
    expect(productsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'product-id', rating: 4 }),
    );
  });

  it('rejects review creation for a missing product', async () => {
    vi.mocked(productsRepository.findOne).mockResolvedValue(null);
    await expect(
      service.createReview('missing-product', 'user-id', { rating: 5, comment: 'Great' }),
    ).rejects.toThrow();
    expect(reviewsRepository.save).not.toHaveBeenCalled();
  });

  it('allows review owners to edit their review and updates product rating', async () => {
    const review = { id: 'review-id', user: { id: 'owner', roles: [UserRole.USER] }, product: { id: 'product-id', rating: 5 }, rating: 5, comment: 'Old', date: new Date(), reviewerName: 'owner' } as Review;
    vi.mocked(reviewsRepository.findOne).mockResolvedValue(review);
    vi.mocked(reviewsRepository.find).mockResolvedValue([{ rating: 3 }, { rating: 5 }] as Review[]);
    vi.mocked(reviewsRepository.save).mockImplementation(async (saved) => saved as Review);
    await expect(service.updateReview('product-id', 'review-id', 'owner', { rating: 3, comment: ' Updated ' })).resolves.toMatchObject({ rating: 3, comment: 'Updated', userId: 'owner', updatedAt: expect.any(String) });
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'product-id', rating: 4 }));
  });

  it('rejects edits by anyone other than the review owner', async () => {
    vi.mocked(reviewsRepository.findOne).mockResolvedValue({ user: { id: 'owner' } } as Review);
    await expect(service.updateReview('product-id', 'review-id', 'other', { rating: 4, comment: 'Changed' })).rejects.toThrow();
    expect(reviewsRepository.save).not.toHaveBeenCalled();
  });

  it('allows moderators to delete non-admin reviews and resets rating when none remain', async () => {
    const review = { id: 'review-id', user: { id: 'owner', roles: [UserRole.USER] }, product: { id: 'product-id', rating: 5 } } as Review;
    vi.mocked(reviewsRepository.findOne).mockResolvedValue(review);
    vi.mocked(reviewsRepository.find).mockResolvedValue([]);
    await service.deleteReview('product-id', 'review-id', 'moderator', [UserRole.MODERATOR]);
    expect(reviewsRepository.remove).toHaveBeenCalledWith(review);
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ rating: 0 }));
  });

  it('allows owners to delete their own reviews', async () => {
    const review = { id: 'review-id', user: { id: 'owner', roles: [UserRole.USER] }, product: { id: 'product-id' } } as Review;
    vi.mocked(reviewsRepository.findOne).mockResolvedValue(review);
    vi.mocked(reviewsRepository.find).mockResolvedValue([]);
    await service.deleteReview('product-id', 'review-id', 'owner', [UserRole.USER]);
    expect(reviewsRepository.remove).toHaveBeenCalledWith(review);
  });

  it('rejects regular users from deleting another users review', async () => {
    vi.mocked(reviewsRepository.findOne).mockResolvedValue({ user: { id: 'owner', roles: [UserRole.USER] } } as Review);
    await expect(service.deleteReview('product-id', 'review-id', 'other', [UserRole.USER])).rejects.toThrow();
    expect(reviewsRepository.remove).not.toHaveBeenCalled();
  });

  it('prevents moderators from deleting an administrator review', async () => {
    vi.mocked(reviewsRepository.findOne).mockResolvedValue({ user: { id: 'admin', roles: [UserRole.ADMIN] } } as Review);
    await expect(service.deleteReview('product-id', 'review-id', 'moderator', [UserRole.MODERATOR])).rejects.toThrow();
    expect(reviewsRepository.remove).not.toHaveBeenCalled();
  });

  it('allows administrators to delete administrator reviews', async () => {
    const review = { id: 'review-id', user: { id: 'admin', roles: [UserRole.ADMIN] }, product: { id: 'product-id' } } as Review;
    vi.mocked(reviewsRepository.findOne).mockResolvedValue(review);
    vi.mocked(reviewsRepository.find).mockResolvedValue([]);
    await expect(service.deleteReview('product-id', 'review-id', 'admin', [UserRole.ADMIN])).resolves.toBeUndefined();
    expect(reviewsRepository.remove).toHaveBeenCalledWith(review);
  });

  it('returns reviews linked to the requested user without exposing email', async () => {
    vi.mocked(reviewsRepository.find).mockResolvedValue([{
      product: { id: 'product-id', title: 'Product title', thumbnail: 'https://example.com/thumb.webp' },
      id: 'review-id', rating: 5, comment: 'A review', date: new Date('2026-01-01'), reviewerName: 'Alice',
    }] as Review[]);
    await expect(service.getReviewsByUserId('user-id')).resolves.toEqual([{
      productId: 'product-id', productTitle: 'Product title', productThumbnail: 'https://example.com/thumb.webp',
      review: { id: 'review-id', rating: 5, comment: 'A review', date: '2026-01-01T00:00:00.000Z', updatedAt: null, reviewerName: 'Alice' },
    }]);
    expect(reviewsRepository.find).toHaveBeenCalledWith({ where: { user: { id: 'user-id' } }, relations: { product: true }, order: { date: 'DESC' } });
  });

  it('gets a product by ID and localizes its availability status', async () => {
    const product = { id: 'product-id', availabilityStatus: 'In Stock' } as Product;
    vi.mocked(productsRepository.findOne).mockResolvedValue(product);
    await expect(service.getProductById('product-id')).resolves.toMatchObject({ id: 'product-id', availabilityStatus: '\u0412 \u043d\u0430\u043b\u0438\u0447\u0438\u0438' });
    expect(productsRepository.findOne).toHaveBeenCalledWith({ where: { id: 'product-id' }, relations: { reviews: { user: true } } });
  });

  it('throws when the requested product does not exist', async () => {
    vi.mocked(productsRepository.findOne).mockResolvedValue(null);

    await expect(service.getProductById('missing-product')).rejects.toThrow(
      'Товар не найден',
    );
  });

  it('updates editable product fields and synchronizes the thumbnail', async () => {
    const product = {
      id: 'product-id',
      title: 'Old title',
      thumbnail: 'https://example.com/old.webp',
      images: ['https://example.com/old.webp'],
      meta: { createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    } as Product;
    const updates = {
      title: 'New title',
      stock: 0,
      images: [
        'https://example.com/new.webp',
        'https://example.com/second.webp',
      ],
    } as UpdateProductDto;
    vi.mocked(productsRepository.findOneBy).mockResolvedValue(product);

    const updatedProduct = await service.updateProduct('product-id', updates);

    expect(productsRepository.findOneBy).toHaveBeenCalledWith({
      id: 'product-id',
    });
    expect(productsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'product-id',
        title: 'New title',
        images: updates.images,
        stock: 0,
        thumbnail: 'https://example.com/new.webp',
        availabilityStatus: 'Out of Stock',
        meta: expect.objectContaining({
          createdAt: '2024-01-01',
          updatedAt: expect.any(String),
        }),
      }),
    );
    expect(updatedProduct).toEqual(
      expect.objectContaining({ title: 'New title' }),
    );
    expect(updatedProduct.availabilityStatus).toBe('Нет в наличии');
  });

  it('throws when updating a product that does not exist', async () => {
    vi.mocked(productsRepository.findOneBy).mockResolvedValue(null);

    await expect(
      service.updateProduct('missing-product', {
        title: 'New title',
      } as UpdateProductDto),
    ).rejects.toThrow('Товар не найден');
    expect(productsRepository.save).not.toHaveBeenCalled();
  });
});
