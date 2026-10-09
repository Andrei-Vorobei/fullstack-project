import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CartItem } from '../../cart/entities/cart-item.entity.js';

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMetadata {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
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

  @Column({ type: 'double precision' })
  discountPercentage: number;

  @Column({ type: 'double precision' })
  rating: number;

  @Column({ type: 'integer' })
  stock: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'double precision' })
  weight: number;

  @Column({ type: 'jsonb' })
  dimensions: ProductDimensions;

  @Column({ type: 'text' })
  warrantyInformation: string;

  @Column({ type: 'text' })
  shippingInformation: string;

  @Column({ type: 'varchar', length: 100 })
  availabilityStatus: string;

  @Column({ type: 'jsonb', default: '[]' })
  reviews: ProductReview[];

  @Column({ type: 'text' })
  returnPolicy: string;

  @Column({ type: 'integer' })
  minimumOrderQuantity: number;

  @Column({ type: 'jsonb' })
  meta: ProductMetadata;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'text' })
  thumbnail: string;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems: CartItem[];
}
