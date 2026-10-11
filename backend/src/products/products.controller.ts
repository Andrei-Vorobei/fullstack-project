import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '#src/auth/jwt.guard.js';
import { ProductsService } from './products.service.js';
import { UserRole } from '#src/users/entities/user-role.enum.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

type AuthenticatedRequest = {
  user: {
    id: string;
    roles: UserRole[];
  };
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @UseGuards(JwtGuard)
  @Post('categories')
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администратор может добавлять категории',
      );
    }

    return this.productsService.createCategory(dto);
  }

  @Get()
  getProductsAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.productsService.getProductsAll(skip, limit);
  }

  @Get('filter')
  getFilteredProducts(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.productsService.getFilteredProducts(
      {
        category,
        brand,
        search,
        minPrice: minPrice === undefined ? undefined : Number(minPrice),
        maxPrice: maxPrice === undefined ? undefined : Number(maxPrice),
        inStock: inStock === undefined ? undefined : inStock === 'true',
      },
      skip,
      limit,
    );
  }

  @UseGuards(JwtGuard)
  @Post(':id/reviews')
  createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() review: CreateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.createReview(id, req.user.id, review);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/reviews/:reviewId')
  updateReview(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() review: UpdateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.updateReview(productId, reviewId, req.user.id, review);
  }

  @UseGuards(JwtGuard)
  @Delete(':id/reviews/:reviewId')
  deleteReview(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.deleteReview(productId, reviewId, req.user.id, req.user.roles);
  }

  @Get(':id')
  getProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @UseGuards(JwtGuard)
  @Post()
  createProduct(
    @Body() product: CreateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Требуется роль администратора');
    }

    return this.productsService.createProduct(product);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  deleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        '?????????????????? ???????? ????????????????????????????',
      );
    }

    return this.productsService.deleteProduct(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (
      !req.user.roles.includes(UserRole.ADMIN) &&
      !req.user.roles.includes(UserRole.MODERATOR)
    ) {
      throw new ForbiddenException('Admin or moderator role required.');
    }

    return this.productsService.updateProduct(id, updates);
  }

  @UseGuards(JwtGuard)
  @Post('import')
  async importProducts(@Req() req: AuthenticatedRequest) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Требуется роль администратора');
    }

    const result = await this.productsService.importFromJson();

    if (!result.fileFound) {
      return {
        imported: 0,
        message: 'Файл import-products.json не найден, импорт не выполнен',
      };
    }

    return {
      imported: result.imported,
      message: `Импортировано товаров: ${result.imported}`,
    };
  }
}
