import { readFile } from 'node:fs/promises';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/products.entity.js';
import { ProductsService } from './products.service.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Pick<
    Repository<Product>,
    'findAndCount' | 'create' | 'save' | 'upsert'
  >;
  let categoriesRepository: Pick<Repository<Category>, 'find'>;

  beforeEach(async () => {
    productsRepository = {
      findAndCount: vi.fn(),
      create: vi.fn((product) => product),
      save: vi.fn(async (product) => product),
      upsert: vi.fn(),
    };
    categoriesRepository = {
      find: vi.fn(),
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
      [{ title: 'Test product', sku: 'TEST-42', externalId: 42 }],
      ['externalId'],
    );
  });

  it('creates a product in the repository', async () => {
    const payload = {
      title: 'Laptop',
      description: 'Gaming laptop',
      category: 'electronics',
      price: 999,
      discountPercentage: 10,
      rating: 4.5,
      stock: 12,
      sku: 'LAPTOP-001',
      weight: 2.4,
      dimensions: { width: 35, height: 2, depth: 24 },
      warrantyInformation: '2 years',
      shippingInformation: '3-5 days',
      availabilityStatus: 'In Stock',
      returnPolicy: '30 days',
      minimumOrderQuantity: 1,
      meta: {
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        barcode: '123',
        qrCode: '456',
      },
      thumbnail: 'thumb.jpg',
      images: ['img1.jpg'],
      tags: ['tech'],
      brand: 'BrandX',
      reviews: [],
    } as Partial<Product>;

    const createdProduct = { ...payload, id: '1' } as Product;
    vi.mocked(productsRepository.create).mockReturnValue(createdProduct);
    vi.mocked(productsRepository.save).mockResolvedValue(createdProduct);

    await expect(service.createProduct(payload)).resolves.toEqual(createdProduct);
    expect(productsRepository.create).toHaveBeenCalledWith(payload);
    expect(productsRepository.save).toHaveBeenCalledWith(createdProduct);
  });
});
