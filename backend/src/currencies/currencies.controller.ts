import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity.js';

@Controller('currencies')
export class CurrenciesController {
  constructor(
    @InjectRepository(Currency)
    private readonly currenciesRepository: Repository<Currency>,
  ) {}

  @Get()
  getCurrencies(): Promise<Currency[]> {
    return this.currenciesRepository.find({ order: { code: 'ASC' } });
  }
}
