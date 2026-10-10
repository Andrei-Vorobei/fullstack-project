import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { UserRole } from '#src/users/entities/user-role.enum.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: Pick<
    ProductsService,
    'getProductsAll' | 'createProduct' | 'importFromJson'
  >;

  beforeEach(async () => {
    productsService = {
      getProductsAll: vi.fn(),
      createProduct: vi.fn(),
      importFromJson: vi.fn(),
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

  it('creates a product through the service', async () => {
    const product = { title: 'Laptop', price: 1000 };

    await controller.createProduct(product);

    expect(productsService.createProduct).toHaveBeenCalledWith(product);
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
});
