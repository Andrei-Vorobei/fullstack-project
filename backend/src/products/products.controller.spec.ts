import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { UserRole } from '#src/users/entities/user-role.enum.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: Pick<
    ProductsService,
    | 'getProductsAll'
    | 'getFilteredProducts'
    | 'createProduct'
    | 'importFromJson'
    | 'updateProduct'
  >;

  beforeEach(async () => {
    productsService = {
      getProductsAll: vi.fn(),
      getFilteredProducts: vi.fn(),
      createProduct: vi.fn(),
      importFromJson: vi.fn(),
      updateProduct: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes pagination query values to the service', async () => {
    await controller.getProductsAll(5, 10);

    expect(productsService.getProductsAll).toHaveBeenCalledWith(5, 10);
  });

  it('passes filters and pagination to the filtered products service', async () => {
    await controller.getFilteredProducts(
      'beauty',
      'BrandX',
      'palette',
      '10',
      '50',
      'true',
      20,
      10,
    );

    expect(productsService.getFilteredProducts).toHaveBeenCalledWith(
      {
        category: 'beauty',
        brand: 'BrandX',
        search: 'palette',
        minPrice: 10,
        maxPrice: 50,
        inStock: true,
      },
      20,
      10,
    );
  });

  it('creates a product for an admin', async () => {
    const product = {
      title: 'Laptop',
      description: 'Gaming laptop',
      category: 'electronics',
      brand: 'BrandX',
      price: 1000,
      stock: 5,
      images: ['https://example.com/laptop.webp'],
    };

    await controller.createProduct(product, {
      user: { roles: [UserRole.ADMIN] },
    });

    expect(productsService.createProduct).toHaveBeenCalledWith(product);
  });

  it('rejects product creation for non-admin users', async () => {
    expect(() =>
      controller.createProduct(
        {
          title: 'Laptop',
          description: 'Gaming laptop',
          category: 'electronics',
          brand: 'BrandX',
          price: 1000,
          stock: 5,
          images: ['https://example.com/laptop.webp'],
        },
        { user: { roles: [UserRole.USER] } },
      ),
    ).toThrow(ForbiddenException);

    expect(productsService.createProduct).not.toHaveBeenCalled();
  });

  it('imports products for an admin', async () => {
    vi.mocked(productsService.importFromJson).mockResolvedValue({
      fileFound: true,
      imported: 1,
    });

    await controller.importProducts({
      user: { roles: [UserRole.ADMIN] },
    });

    expect(productsService.importFromJson).toHaveBeenCalledOnce();
  });

  it('reports when the products JSON file is missing', async () => {
    vi.mocked(productsService.importFromJson).mockResolvedValue({
      fileFound: false,
      imported: 0,
    });

    await expect(
      controller.importProducts({
        user: { roles: [UserRole.ADMIN] },
      }),
    ).resolves.toEqual({
      imported: 0,
      message: 'Файл import-products.json не найден, импорт не выполнен',
    });
  });

  it('rejects product imports for non-admin users', async () => {
    await expect(
      controller.importProducts({
        user: { roles: [UserRole.USER] },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(productsService.importFromJson).not.toHaveBeenCalled();
  });

  it('updates a product for an admin', async () => {
    const updates = { title: 'Updated product' };
    await controller.updateProduct('product-id', updates, {
      user: { roles: [UserRole.ADMIN] },
    });

    expect(productsService.updateProduct).toHaveBeenCalledWith(
      'product-id',
      updates,
    );
  });

  it('rejects product updates for non-admin users', async () => {
    expect(() =>
      controller.updateProduct(
        'product-id',
        { title: 'Updated product' },
        {
          user: { roles: [UserRole.USER] },
        },
      ),
    ).toThrow(ForbiddenException);
    expect(productsService.updateProduct).not.toHaveBeenCalled();
  });
});
