import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity.js';
import { CurrenciesController } from './currencies.controller.js';

describe('CurrenciesController', () => {
  let controller: CurrenciesController;
  let currenciesRepository: Pick<Repository<Currency>, 'find'>;

  beforeEach(async () => {
    currenciesRepository = { find: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [
        {
          provide: getRepositoryToken(Currency),
          useValue: currenciesRepository,
        },
      ],
    }).compile();

    controller = module.get<CurrenciesController>(CurrenciesController);
  });

  it('returns currencies in code order', async () => {
    const currencies = [
      { code: 'EUR', name: 'Евро', symbol: '€' },
      { code: 'USD', name: 'Доллар США', symbol: '$' },
    ] as Currency[];
    vi.mocked(currenciesRepository.find).mockResolvedValue(currencies);

    await expect(controller.getCurrencies()).resolves.toBe(currencies);
    expect(currenciesRepository.find).toHaveBeenCalledWith({
      order: { code: 'ASC' },
    });
  });
});
