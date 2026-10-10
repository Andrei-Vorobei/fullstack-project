import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard.js';
import { User } from '../users/entities/user.entity.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { MergeGuestCartDto } from './dto/merge-guest-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { CartService } from './cart.service.js';

type AuthenticatedRequest = Request & { user: User };

@Controller('cart')
@UseGuards(JwtGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.user.id);
  }

  @Get('users/:userId')
  getUserCart(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  addItem(@Req() request: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(
      request.user.id,
      dto.productId,
      dto.quantity,
    );
  }

  @Post('merge-guest')
  mergeGuestCart(
    @Req() request: AuthenticatedRequest,
    @Body() dto: MergeGuestCartDto,
  ) {
    return this.cartService.mergeGuestCart(
      request.user.id,
      dto.migrationId,
      dto.items,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(request.user.id, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.cartService.removeItem(request.user.id, itemId);
  }

  @Delete('items')
  clearCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.clearCart(request.user.id);
  }
}
