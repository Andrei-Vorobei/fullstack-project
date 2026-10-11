import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/products.entity.js';
import { Review } from './entities/review.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import type { CurrencyCode } from '../currencies/entities/currency.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { getCategoryName } from './category-names.js';
import { UserRole } from '../users/entities/user-role.enum.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

type ProductFromJson = Omit<
  Product,
  'id' | 'externalId' | 'currencyCode' | 'reviews'
> & {
  id: number;
  currencyCode?: CurrencyCode;
  reviews?: unknown;
};

export interface ProductsPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

const availabilityStatusTranslations: Record<string, string> = {
  'In Stock': 'В наличии',
  'Out of Stock': 'Нет в наличии',
  'Low Stock': 'Мало на складе',
};

const localizeAvailabilityStatus = (status?: string): string | undefined =>
  status === undefined
    ? undefined
    : (availabilityStatusTranslations[status] ?? status);

const localizeProductAvailabilityStatus = (product: Product): Product =>
  Object.assign(new Product(), product, {
    availabilityStatus:
      localizeAvailabilityStatus(product.availabilityStatus) ??
      product.availabilityStatus,
  });

export type ProductReviewWithAuthor = Pick<Review, 'id' | 'rating' | 'comment' | 'reviewerName'> & {
  date: string;
  updatedAt: string | null;
  userId: string | null;
  authorIsAdmin: boolean;
};

export type ProductWithReviewAuthors = Omit<Product, 'reviews'> & {
  reviews: ProductReviewWithAuthor[];
};

export type ProductReviewWithProduct = {
  productId: string;
  productTitle: string;
  productThumbnail: string;
  review: {
    id: string;
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
  };
};

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
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createCategory(input: CreateCategoryDto): Promise<Category> {
    const name = input.name.trim().replace(/\s+/g, ' ');
    const slug = input.slug.trim();

    const existingCategory = await this.categoriesRepository.findOneBy({
      slug,
    });
    if (existingCategory) {
      throw new ConflictException('Категория с таким slug уже существует');
    }

    return this.categoriesRepository.save({ slug, name });
  }

  async getProductsAll(skip = 0, limit?: number): Promise<ProductsPage> {
    if (
      !Number.isSafeInteger(skip) ||
      skip < 0 ||
      (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1))
    ) {
      throw new BadRequestException(
        'Смещение должно быть неотрицательным целым числом, а лимит — положительным целым числом',
      );
    }

    const [products, total] = await this.productsRepository.findAndCount({
      skip,
      ...(limit === undefined ? {} : { take: limit }),
      order: { externalId: 'ASC' },
      relations: { reviews: true },
    });

    return {
      products: products.map(localizeProductAvailabilityStatus),
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

    const categorySlug = category.toLowerCase();
    const existingCategory = await this.categoriesRepository.findOneBy({
      slug: categorySlug,
    });

    if (!existingCategory) {
      await this.categoriesRepository.save({
        slug: categorySlug,
        name: getCategoryName(categorySlug),
      });
    }

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
      rating: 0,
      sku,
      weight: input.weight ?? 0,
      dimensions: input.dimensions ?? { width: 0, height: 0, depth: 0 },
      availabilityStatus:
        input.availabilityStatus ??
        (input.stock > 0 ? 'In Stock' : 'Out of Stock'),
      meta: {
        createdAt: meta?.createdAt ?? now,
        updatedAt: meta?.updatedAt ?? now,
      },
      images: input.images,
      thumbnail: input.thumbnail ?? input.images[0],
    });
    const createdProduct = await this.productsRepository.save(newProduct);
    return localizeProductAvailabilityStatus(createdProduct);
  }

  async createReview(
    productId: string,
    userId: string,
    input: CreateReviewDto,
  ): Promise<Pick<Review, 'id' | 'rating' | 'comment' | 'date' | 'updatedAt' | 'reviewerName'>> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: { reviews: true },
    });
    if (!product) {
      throw new NotFoundException('\u0422\u043e\u0432\u0430\u0440 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
    }

    const review = this.reviewsRepository.create({
      product,
      user,
      rating: input.rating,
      comment: input.comment.trim(),
      date: new Date(),
      updatedAt: null,
      reviewerName: user.username,
    });
    const savedReview = await this.reviewsRepository.save(review);

    product.reviews = [...(product.reviews ?? []), savedReview];
    product.rating =
      product.reviews.reduce((sum, item) => sum + item.rating, 0) /
      product.reviews.length;
    await this.productsRepository.save(product);

    return {
      id: savedReview.id,
      rating: savedReview.rating,
      comment: savedReview.comment,
      date: savedReview.date,
      updatedAt: savedReview.updatedAt,
      reviewerName: savedReview.reviewerName,
    };
  }

  async updateReview(
    productId: string,
    reviewId: string,
    userId: string,
    input: UpdateReviewDto,
  ): Promise<ProductReviewWithAuthor> {
    const review = await this.findReview(productId, reviewId);
    if (review.user?.id !== userId) {
      throw new ForbiddenException('\u041c\u043e\u0436\u043d\u043e \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0441\u0432\u043e\u0439 \u043e\u0442\u0437\u044b\u0432');
    }

    review.rating = input.rating;
    review.comment = input.comment.trim();
    review.updatedAt = new Date();
    const savedReview = await this.reviewsRepository.save(review);
    await this.recalculateProductRating(review.product);
    return this.toReviewWithAuthor(savedReview);
  }

  async deleteReview(
    productId: string,
    reviewId: string,
    userId: string,
    userRoles: UserRole[],
  ): Promise<void> {
    const review = await this.findReview(productId, reviewId);
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isModerator = userRoles.includes(UserRole.MODERATOR);
    const isOwner = review.user?.id === userId;
    const authorIsAdmin = review.user?.roles.includes(UserRole.ADMIN) ?? false;

    if (authorIsAdmin && !isAdmin) {
      throw new ForbiddenException('\u041e\u0442\u0437\u044b\u0432 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430 \u043c\u043e\u0436\u0435\u0442 \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440');
    }
    if (!isOwner && !isAdmin && !isModerator) {
      throw new ForbiddenException('\u041c\u043e\u0436\u043d\u043e \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0441\u0432\u043e\u0439 \u043e\u0442\u0437\u044b\u0432');
    }

    await this.reviewsRepository.remove(review);
    await this.recalculateProductRating(review.product);
  }

  private async findReview(productId: string, reviewId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId, product: { id: productId } },
      relations: { product: true, user: true },
    });
    if (!review) {
      throw new NotFoundException('\u041e\u0442\u0437\u044b\u0432 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
    }
    return review;
  }

  private async recalculateProductRating(product: Product): Promise<void> {
    const reviews = await this.reviewsRepository.find({
      where: { product: { id: product.id } },
    });
    product.rating = reviews.length
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0;
    await this.productsRepository.save(product);
  }

  private toReviewWithAuthor(review: Review): ProductReviewWithAuthor {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      date: review.date.toISOString(),
      updatedAt: review.updatedAt?.toISOString() ?? null,
      reviewerName: review.reviewerName,
      userId: review.user?.id ?? null,
      authorIsAdmin: review.user?.roles.includes(UserRole.ADMIN) ?? false,
    };
  }

  async getReviewsByUserId(
    userId: string,
  ): Promise<ProductReviewWithProduct[]> {
    const reviews = await this.reviewsRepository.find({
      where: { user: { id: userId } },
      relations: { product: true },
      order: { date: 'DESC' },
    });

    return reviews.map((review) => ({
      productId: review.product.id,
      productTitle: review.product.title,
      productThumbnail: review.product.thumbnail,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        date: review.date.toISOString(),
        updatedAt: review.updatedAt?.toISOString() ?? null,
        reviewerName: review.reviewerName,
      },
    }));
  }

  async getProductById(id: string): Promise<ProductWithReviewAuthors> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { reviews: { user: true } },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return Object.assign(localizeProductAvailabilityStatus(product), {
      reviews: (product.reviews ?? []).map((review) => this.toReviewWithAuthor(review)),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { cartItems: true },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    if (product.cartItems.length > 0) {
      throw new ConflictException(
        'Нельзя удалить товар, пока он находится в корзине',
      );
    }

    await this.productsRepository.remove(product);
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

    const updatedProduct = await this.productsRepository.save(product);
    return localizeProductAvailabilityStatus(updatedProduct);
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
        'Смещение должно быть неотрицательным целым числом, а лимит — положительным целым числом',
      );
    }

    const { category, brand, search, minPrice, maxPrice, inStock } = filters;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.reviews', 'review')
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
      products: products.map(localizeProductAvailabilityStatus),
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

    const importedProducts = data.products.map(
      ({ id, reviews: _legacyReviews, ...product }) => {
        const availabilityStatus = localizeAvailabilityStatus(
          product.availabilityStatus,
        );
        return {
          ...product,
          rating: 0,
          ...(availabilityStatus === undefined ? {} : { availabilityStatus }),
          currencyCode: product.currencyCode ?? 'USD',
          externalId: id,
        };
      },
    );

    if (importedProducts.length > 0) {
      await this.productsRepository.upsert(importedProducts, ['externalId']);
    }

    return { fileFound: true, imported: importedProducts.length };
  }
}
