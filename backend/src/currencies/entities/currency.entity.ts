import { Column, Entity, PrimaryColumn } from 'typeorm';

export const CURRENCY_CODES = ['USD', 'EUR', 'RUB'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

@Entity('currencies')
export class Currency {
  @PrimaryColumn({ type: 'varchar', length: 3 })
  code: CurrencyCode;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  symbol: string;
}
