import {
  Check,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Product } from '../../products/entities/products.entity.js';
import { Cart } from './cart.entity.js';

@Entity('cart_items')
@Index(['cart', 'product'], { unique: true })
@Check('"quantity" > 0')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Relation<Cart>;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  product: Relation<Product>;

  @Column({ type: 'integer' })
  quantity: number;
}
