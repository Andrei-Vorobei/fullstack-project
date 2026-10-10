import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity.js';
import { CartService } from './cart.service.js';
import { User } from '../users/entities/user.entity.js';
import { Product } from '../products/entities/products.entity.js';
import { CartItem } from './entities/cart-item.entity.js';
import { GuestCartMigration } from './entities/guest-cart-migration.entity.js';

describe('CartService', () => {
  let service: CartService;
  let cartsRepository: Pick<Repository<Cart>, 'findOne'>;
  let dataSource: Pick<DataSource, 'transaction'>;

  beforeEach(async () => {
    cartsRepository = {
      findOne: vi.fn(),
    };
    dataSource = {
      transaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(Cart),
          useValue: cartsRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('returns an empty cart when the user has not added any items', async () => {
    vi.mocked(cartsRepository.findOne).mockResolvedValue(null);

    await expect(service.getCart('user-id')).resolves.toEqual({
      id: null,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  });

  it('returns item and price totals for the user cart', async () => {
    const cart = {
      id: 'cart-id',
      items: [
        { quantity: 2, product: { price: 9.99 } },
        { quantity: 1, product: { price: 5 } },
      ],
    } as Cart;
    vi.mocked(cartsRepository.findOne).mockResolvedValue(cart);

    await expect(service.getCart('user-id')).resolves.toEqual({
      id: 'cart-id',
      items: cart.items,
      totalItems: 3,
      totalPrice: 24.98,
    });
  });

  it('allows adding a quantity below the product minimum order quantity', async () => {
    const user = { id: 'user-id' } as User;
    const cart = { id: 'cart-id', user } as Cart;
    const product = {
      id: 'product-id',
      stock: 100,
      minimumOrderQuantity: 20,
      price: 5,
    } as Product;
    const savedCart = {
      id: cart.id,
      items: [{ quantity: 1, product }],
    } as Cart;
    let cartLookups = 0;
    const manager = {
      findOne: vi.fn(async (entity: unknown) => {
        if (entity === User) return user;
        if (entity === Cart) {
          cartLookups += 1;
          return cartLookups === 1 ? null : savedCart;
        }
        if (entity === Product) return product;
        if (entity === CartItem) return null;
        return null;
      }),
      create: vi.fn((_entity: unknown, value: unknown) => value),
      save: vi.fn(async (_entity: unknown, value: { id?: string }) => ({
        ...value,
        id: value.id ?? 'cart-id',
      })),
    } as unknown as EntityManager;

    vi.mocked(dataSource.transaction).mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.addItem('user-id', 'product-id', 1),
    ).resolves.toMatchObject({
      id: 'cart-id',
      totalItems: 1,
      totalPrice: 5,
    });

  });

  it('does not apply a guest cart migration more than once', async () => {
    const user = { id: 'user-id' } as User;
    const cart = { id: 'cart-id', items: [] } as Cart;
    const manager = {
      findOne: vi.fn(async (entity: unknown) => {
        if (entity === User) return user;
        if (entity === Cart) return cart;
        if (entity === GuestCartMigration) return { id: 'migration-record-id' };
        return null;
      }),
      create: vi.fn((_entity: unknown, value: unknown) => value),
      save: vi.fn(),
    } as unknown as EntityManager;

    vi.mocked(dataSource.transaction).mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.mergeGuestCart('user-id', 'migration-id', [
        { productId: 'product-id', quantity: 2 },
      ]),
    ).resolves.toMatchObject({
      id: 'cart-id',
      totalItems: 0,
      totalPrice: 0,
    });
    expect(manager.save).not.toHaveBeenCalled();
  });
});
