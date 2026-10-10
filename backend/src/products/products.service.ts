import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/products.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import type { CurrencyCode } from '../currencies/entities/currency.entity.js';

type ProductFromJson = Omit<Product, 'id' | 'externalId' | 'currencyCode'> & {
  id: number;
  currencyCode?: CurrencyCode;
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
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async getCategories(): Promise<string[]> {
    const categories = await this.categoriesRepository.find({
      select: { slug: true },
      order: { slug: 'ASC' },
    });

    return categories.map(({ slug }) => slug);
  }

  async getProductsAll(skip = 0, limit?: number): Promise<ProductsPage> {
    if (
      !Number.isSafeInteger(skip) ||
      skip < 0 ||
      (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1))
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

  async createProduct(input: CreateProductDto): Promise<Product> {
    const now = new Date().toISOString();
    const sku = input.sku?.trim() || `CUSTOM-${randomUUID()}`;
    const category = input.category.trim();
    const meta = input.meta;

    await this.categoriesRepository.upsert(
      { slug: category.toLowerCase(), name: category },
      ['slug'],
    );

    const newProduct = this.productsRepository.create({
      externalId: null,
      title: input.title.trim(),
      description: input.description.trim(),
      category,
      brand: input.brand.trim(),
      price: input.price,
      currencyCode: input.currencyCode ?? 'USD',
      stock: input.stock,
      discountPercentage: input.discountPercentage ?? 0,
      rating: input.rating ?? 0,
      tags: input.tags ?? [],
      sku,
      weight: input.weight ?? 0,
      dimensions: input.dimensions ?? { width: 0, height: 0, depth: 0 },
      warrantyInformation: input.warrantyInformation ?? 'Не указана',
      shippingInformation: input.shippingInformation ?? 'Не указана',
      availabilityStatus:
        input.availabilityStatus ??
        (input.stock > 0 ? 'In Stock' : 'Out of Stock'),
      reviews: input.reviews ?? [],
      returnPolicy: input.returnPolicy ?? 'Не указана',
      minimumOrderQuantity: input.minimumOrderQuantity ?? 1,
      meta: {
        createdAt: meta?.createdAt ?? now,
        updatedAt: meta?.updatedAt ?? now,
        barcode: meta?.barcode ?? sku,
        qrCode: meta?.qrCode ?? '',
      },
      images: input.images,
      thumbnail: input.thumbnail ?? input.images[0],
    });
    return this.productsRepository.save(newProduct);
  }

  async updateProduct(id: string, updates: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const availabilityStatus = product.availabilityStatus;
    Object.assign(product, updates);

    if (updates.images?.length) {
      product.thumbnail = updates.images[0];
    }
    if (updates.stock !== undefined) {
      product.availabilityStatus =
        updates.stock === 0
          ? 'Out of Stock'
          : availabilityStatus === 'Out of Stock'
            ? 'In Stock'
            : availabilityStatus;
    }
    product.meta = {
      ...product.meta,
      updatedAt: new Date().toISOString(),
    };

    return this.productsRepository.save(product);
  }

  async getFilteredProducts(
    filters: ProductFilters,
    skip = 0,
    limit?: number,
  ): Promise<ProductsPage> {
    if (
      !Number.isSafeInteger(skip) ||
      skip < 0 ||
      (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1))
    ) {
      throw new BadRequestException(
        'skip must be a non-negative integer and limit must be a positive integer',
      );
    }

    const { category, brand, search, minPrice, maxPrice, inStock } = filters;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .where('1 = 1');

    if (category) {
      query.andWhere('LOWER(product.category) = LOWER(:category)', {
        category,
      });
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

    if (inStock === true) {
      query.andWhere('product.stock > 0');
    } else if (inStock === false) {
      query.andWhere('product.stock <= 0');
    }

    if (search) {
      const normalizedSearch = `%${search.trim()}%`;
      query.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search) OR LOWER(product.brand) LIKE LOWER(:search))',
        { search: normalizedSearch },
      );
    }

    query.orderBy('product.externalId', 'ASC').skip(skip);
    if (limit !== undefined) {
      query.take(limit);
    }

    const [products, total] = await query.getManyAndCount();

    return {
      products,
      total,
      skip,
      limit: limit ?? total,
    };
  }

  async importFromJson(): Promise<{ fileFound: boolean; imported: number }> {
    let file: string;

    try {
      file = await readFile(
        resolve(process.cwd(), 'import-products.json'),
        'utf8',
      );
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
      currencyCode: product.currencyCode ?? 'USD',
      externalId: id,
    }));

    if (products.length > 0) {
      await this.productsRepository.upsert(products, ['externalId']);
    }

    return { fileFound: true, imported: products.length };
  }
}
