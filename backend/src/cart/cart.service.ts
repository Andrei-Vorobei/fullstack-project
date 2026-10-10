import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Product } from '../products/entities/products.entity.js';
import { Cart } from './entities/cart.entity.js';
import { CartItem } from './entities/cart-item.entity.js';
import { GuestCartMigration } from './entities/guest-cart-migration.entity.js';

export interface CartResponse {
  id: string | null;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable()
export class CartService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
  ) {}

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: true } },
      order: { createdAt: 'ASC' },
    });

    return this.toResponse(cart);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartResponse> {
    return this.dataSource.transaction(async (manager) => {
      const { cart } = await this.getOrCreateCart(manager, userId);
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Товар не найден');
      }

      let item = await manager.findOne(CartItem, {
        where: { cart: { id: cart.id }, product: { id: product.id } },
      });
      const nextQuantity = (item?.quantity ?? 0) + quantity;

      this.ensureAvailableQuantity(product, nextQuantity);

      if (item) {
        item.quantity = nextQuantity;
      } else {
        item = manager.create(CartItem, { cart, product, quantity });
      }

      await manager.save(CartItem, item);
      return this.getCartWithManager(manager, cart.id);
    });
  }

  async mergeGuestCart(
    userId: string,
    migrationId: string,
    guestItems: Array<{ productId: string; quantity: number }>,
  ): Promise<CartResponse> {
    return this.dataSource.transaction(async (manager) => {
      const { user, cart } = await this.getOrCreateCart(manager, userId);
      const existingMigration = await manager.findOne(GuestCartMigration, {
        where: { user: { id: user.id }, migrationId },
      });

      if (existingMigration) {
        return this.getCartWithManager(manager, cart.id);
      }

      const quantitiesByProduct = new Map<string, number>();
      for (const item of guestItems) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException('Товар не найден');
        }

        const item = await manager.findOne(CartItem, {
          where: { cart: { id: cart.id }, product: { id: product.id } },
        });
        const nextQuantity = (item?.quantity ?? 0) + quantity;
        this.ensureAvailableQuantity(product, nextQuantity);

        if (item) {
          item.quantity = nextQuantity;
          await manager.save(CartItem, item);
        } else {
          await manager.save(
            CartItem,
            manager.create(CartItem, { cart, product, quantity }),
          );
        }
      }

      await manager.save(
        GuestCartMigration,
        manager.create(GuestCartMigration, { user, migrationId }),
      );
      return this.getCartWithManager(manager, cart.id);
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartResponse> {
    return this.dataSource.transaction(async (manager) => {
      const { cart } = await this.getOrCreateCart(manager, userId);
      const item = await manager.findOne(CartItem, {
        where: { id: itemId, cart: { id: cart.id } },
        relations: { product: true },
      });

      if (!item) {
        throw new NotFoundException('Позиция корзины не найдена');
      }

      const product = await manager.findOne(Product, {
        where: { id: item.product.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Товар не найден');
      }

      this.ensureAvailableQuantity(product, quantity);
      item.quantity = quantity;
      await manager.save(CartItem, item);
      return this.getCartWithManager(manager, cart.id);
    });
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    return this.dataSource.transaction(async (manager) => {
      const { cart } = await this.getOrCreateCart(manager, userId);
      const item = await manager.findOne(CartItem, {
        where: { id: itemId, cart: { id: cart.id } },
      });

      if (!item) {
        throw new NotFoundException('Позиция корзины не найдена');
      }

      await manager.remove(CartItem, item);
      return this.getCartWithManager(manager, cart.id);
    });
  }

  async clearCart(userId: string): Promise<CartResponse> {
    return this.dataSource.transaction(async (manager) => {
      const { cart } = await this.getOrCreateCart(manager, userId);
      await manager.delete(CartItem, { cart: { id: cart.id } });
      return this.getCartWithManager(manager, cart.id);
    });
  }

  private async getOrCreateCart(
    manager: EntityManager,
    userId: string,
  ): Promise<{ user: User; cart: Cart }> {
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    let cart = await manager.findOne(Cart, {
      where: { user: { id: user.id } },
    });

    if (!cart) {
      cart = await manager.save(Cart, manager.create(Cart, { user }));
    }

    return { user, cart };
  }

  private async getCartWithManager(
    manager: EntityManager,
    cartId: string,
  ): Promise<CartResponse> {
    const cart = await manager.findOne(Cart, {
      where: { id: cartId },
      relations: { items: { product: true } },
    });
    return this.toResponse(cart);
  }

  private toResponse(cart: Cart | null): CartResponse {
    const items = cart?.items ?? [];
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce(
      (total, item) => total + item.quantity * item.product.price,
      0,
    );

    return {
      id: cart?.id ?? null,
      items,
      totalItems,
      totalPrice: Number(totalPrice.toFixed(2)),
    };
  }

  private ensureAvailableQuantity(product: Product, quantity: number): void {
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Недостаточно товара на складе. Доступно: ${product.stock}`,
      );
    }
  }
}
