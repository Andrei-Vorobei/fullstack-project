import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.enum.js';
import { Cart } from '../../cart/entities/cart.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  @Exclude()
  yandexId: string | null;

  @Column({ unique: true })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'users_roles_enum',
    array: true,
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Column({ length: 200, default: 'Пока ничего не рассказал о себе' })
  about: string;

  @Column({
    default: 'https://i.pravatar.cc/300',
    length: 500,
  })
  avatar: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar' })
  @Exclude({ toPlainOnly: true })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Relation<Cart>;
}
