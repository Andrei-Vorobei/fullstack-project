import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;
}
