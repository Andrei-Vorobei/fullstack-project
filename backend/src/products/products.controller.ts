import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '#src/auth/jwt.guard.js';
import { Product } from './entities/products.entity.js';
import { ProductsService } from './products.service.js';
import { UserRole } from '#src/users/entities/user-role.enum.js';

type AuthenticatedRequest = {
  user: {
    roles: UserRole[];
  };
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
  ) {
    return this.productsService.getFilteredProducts({
      category,
      brand,
      search,
      minPrice: minPrice === undefined ? undefined : Number(minPrice),
      maxPrice: maxPrice === undefined ? undefined : Number(maxPrice),
      inStock: inStock === undefined ? undefined : inStock === 'true',
    });
  }

  @Post()
  createProduct(@Body() product: Partial<Product>) {
    return this.productsService.createProduct(product);
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
        message: 'Файл products.json не найден, импорт не выполнен',
      };
    }

    return {
      imported: result.imported,
      message: `Импортировано товаров: ${result.imported}`,
    };
  }
}
