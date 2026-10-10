import { readFile } from 'node:fs/promises';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/products.entity.js';
import { ProductsService } from './products.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';

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
    | 'createQueryBuilder'
  >;
  let categoriesRepository: Pick<Repository<Category>, 'find' | 'upsert'>;

  beforeEach(async () => {
    productsRepository = {
      findAndCount: vi.fn(),
      create: vi.fn((product) => product),
      save: vi.fn(async (product) => product),
      upsert: vi.fn(),
      findOneBy: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    categoriesRepository = {
      find: vi.fn(),
      upsert: vi.fn(),
    };

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
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns category slugs in alphabetical order', async () => {
    vi.mocked(categoriesRepository.find).mockResolvedValue([
      { slug: 'beauty' },
      { slug: 'fragrances' },
    ] as Category[]);

    await expect(service.getCategories()).resolves.toEqual([
      'beauty',
      'fragrances',
    ]);
    expect(categoriesRepository.find).toHaveBeenCalledWith({
      select: { slug: true },
      order: { slug: 'ASC' },
    });
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
    });
  });

  it('rejects invalid pagination values', async () => {
    await expect(service.getProductsAll(-1)).rejects.toThrow(
      'skip must be a non-negative integer',
    );
    await expect(service.getProductsAll(0, 0)).rejects.toThrow(
      'limit must be a positive integer',
    );
  });

  it.each([
    [true, 'product.stock > 0'],
    [false, 'product.stock <= 0'],
  ])('filters products by stock availability (%s)', async (inStock, condition) => {
    const query = {
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
  });

  it('paginates filtered products and returns the total matching count', async () => {
    const products = [{ externalId: 11 }] as Product[];
    const query = {
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
        },
      ],
      ['externalId'],
    );
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
        tags: [],
        reviews: [],
        minimumOrderQuantity: 1,
        externalId: null,
        meta: expect.objectContaining({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      }),
    );
    expect(repositoryInput.sku).toMatch(/^CUSTOM-[0-9a-f-]{36}$/i);
    expect(categoriesRepository.upsert).toHaveBeenCalledWith(
      { slug: 'electronics', name: 'electronics' },
      ['slug'],
    );
    expect(productsRepository.save).toHaveBeenCalledWith(repositoryInput);
    expect(createdProduct).toEqual(repositoryInput);
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
      rating: 2.86,
      stock: 34,
      tags: ['beauty', 'eyeshadow'],
      sku: 'BEA-GLA-EYE-002',
      weight: 9,
      dimensions: { depth: 27.67, width: 9.26, height: 22.47 },
      warrantyInformation: '1 year warranty',
      shippingInformation: 'Ships in 2 weeks',
      availabilityStatus: 'In Stock',
      reviews: [
        {
          date: '2025-04-30T09:41:02.053Z',
          rating: 5,
          comment: 'Great product!',
          reviewerName: 'Savannah Gomez',
          reviewerEmail: 'savannah.gomez@example.com',
        },
      ],
      returnPolicy: '7 days return policy',
      minimumOrderQuantity: 20,
      meta: {
        qrCode: 'https://example.com/qr.png',
        barcode: '9170275171413',
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
        rating: payload.rating,
        reviews: payload.reviews,
        dimensions: payload.dimensions,
        meta: payload.meta,
        thumbnail: payload.thumbnail,
      }),
    );
    expect(repositoryInput).not.toHaveProperty('id');
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
