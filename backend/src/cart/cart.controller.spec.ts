import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

describe('CartController', () => {
  let controller: CartController;
  let cartService: {
    getCart: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    updateItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clearCart: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    cartService = {
      getCart: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('uses the authenticated user when reading their cart', async () => {
    const request = { user: { id: 'user-id' } } as {
      user: User;
    } & Parameters<CartController['getCart']>[0];

    await controller.getCart(request);

    expect(cartService.getCart).toHaveBeenCalledWith('user-id');
  });

  it('reads the requested user cart without exposing a write operation', async () => {
    const cart = { id: 'cart-id', items: [], totalItems: 0, totalPrice: 0 };
    cartService.getCart.mockResolvedValue(cart);

    await expect(
      controller.getUserCart('other-user-id'),
    ).resolves.toEqual(cart);
    expect(cartService.getCart).toHaveBeenCalledWith('other-user-id');
  });

  it('uses the authenticated user when adding an item', async () => {
    const request = { user: { id: 'user-id' } } as {
      user: User;
    } & Parameters<CartController['addItem']>[0];

    await controller.addItem(request, {
      productId: 'product-id',
      quantity: 2,
    });

    expect(cartService.addItem).toHaveBeenCalledWith(
      'user-id',
      'product-id',
      2,
    );
  });
});
