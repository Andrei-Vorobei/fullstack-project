import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: Pick<ProductsService, 'getProductsAll' | 'createProduct'>;

  beforeEach(async () => {
    productsService = {
      getProductsAll: vi.fn(),
      createProduct: vi.fn(),
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
});
