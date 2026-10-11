import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Product } from './products.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('reviews')
@Check('CHK_reviews_rating_range', '"rating" >= 0 AND "rating" <= 5')
@Index('IDX_reviews_productId', ['product'])
@Index('IDX_reviews_userId', ['user'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  @ManyToOne(() => User, (user) => user.reviews, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User> | null;

  @Column({ type: 'double precision' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'varchar', length: 255 })
  reviewerName: string;
}
