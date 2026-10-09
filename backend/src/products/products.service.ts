import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Repository } from 'typeorm';
import { Product } from './entities/products.entity.js';

type ProductFromJson = Omit<Product, 'id' | 'externalId'> & {
  id: number;
};

export interface ProductsPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export type ProductFilters = {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getProductsAll(skip = 0, limit?: number): Promise<ProductsPage> {
    if (
      !Number.isSafeInteger(skip) ||
      skip < 0 ||
      (limit !== undefined &&
        (!Number.isSafeInteger(limit) || limit < 1))
    ) {
      throw new BadRequestException(
        'skip must be a non-negative integer and limit must be a positive integer',
      );
    }

    const [products, total] = await this.productsRepository.findAndCount({
      skip,
      ...(limit === undefined ? {} : { take: limit }),
      order: { externalId: 'ASC' },
    });

    return {
      products,
      total,
      skip,
      limit: limit ?? total,
    };
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const newProduct = this.productsRepository.create(product);
    return this.productsRepository.save(newProduct);
  }

  async getFilteredProducts(filters: ProductFilters): Promise<Product[]> {
    const { category, brand, search, minPrice, maxPrice, inStock } = filters;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .where('1 = 1');

    if (category) {
      query.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }

    if (brand) {
      query.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand });
    }

    if (typeof minPrice === 'number' && Number.isFinite(minPrice)) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (typeof maxPrice === 'number' && Number.isFinite(maxPrice)) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (typeof inStock === 'boolean') {
      query.andWhere('product.stock > 0 = :inStock', { inStock });
    }

    if (search) {
      const normalizedSearch = `%${search.trim()}%`;
      query.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search) OR LOWER(product.brand) LIKE LOWER(:search))',
        { search: normalizedSearch },
      );
    }

    return query.orderBy('product.externalId', 'ASC').getMany();
  }

  async importFromJson(): Promise<{ fileFound: boolean; imported: number }> {
    let file: string;

    try {
      file = await readFile(resolve(process.cwd(), 'products.json'), 'utf8');
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return { fileFound: false, imported: 0 };
      }

      throw error;
    }

    const data: { products: ProductFromJson[] } = JSON.parse(file);

    const products = data.products.map(({ id, ...product }) => ({
      ...product,
      externalId: id,
    }));

    if (products.length > 0) {
      await this.productsRepository.upsert(products, ['externalId']);
    }

    return { fileFound: true, imported: products.length };
  }
}
