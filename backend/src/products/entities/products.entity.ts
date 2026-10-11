import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CartItem } from '../../cart/entities/cart-item.entity.js';
import type { CurrencyCode } from '../../currencies/entities/currency.entity.js';
import { Review } from './review.entity.js';
import type { Relation } from 'typeorm';

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductMetadata {
  createdAt: string;
  updatedAt: string;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', unique: true, nullable: true })
  externalId: number | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'double precision' })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currencyCode: CurrencyCode;

  @Column({ type: 'double precision' })
  discountPercentage: number;

  @Column({ type: 'double precision' })
  rating: number;

  @Column({ type: 'integer' })
  stock: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'double precision' })
  weight: number;

  @Column({ type: 'jsonb' })
  dimensions: ProductDimensions;

  @Column({ type: 'varchar', length: 100 })
  availabilityStatus: string;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Relation<Review[]>;

  @Column({ type: 'jsonb' })
  meta: ProductMetadata;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'text' })
  thumbnail: string;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems: CartItem[];
}
