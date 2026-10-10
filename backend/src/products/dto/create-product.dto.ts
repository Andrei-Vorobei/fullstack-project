import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CURRENCY_CODES, type CurrencyCode } from '../../currencies/entities/currency.entity.js';

export class CreateProductDimensionsDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  width: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  height: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depth: number;
}

export class CreateProductReviewDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsDateString()
  date: string;

  @IsString()
  reviewerName: string;

  @IsString()
  reviewerEmail: string;
}

export class CreateProductMetaDto {
  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  qrCode?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class CreateProductDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  externalId?: number;

  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  title: string;

  @IsString()
  @Matches(/\S/)
  description: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  category: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  brand: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  stock: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductDimensionsDto)
  dimensions?: CreateProductDimensionsDto;

  @IsOptional()
  @IsString()
  warrantyInformation?: string;

  @IsOptional()
  @IsString()
  shippingInformation?: string;

  @IsOptional()
  @IsString()
  availabilityStatus?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductReviewDto)
  reviews?: CreateProductReviewDto[];

  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumOrderQuantity?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductMetaDto)
  meta?: CreateProductMetaDto;

  @IsOptional()
  @IsUrl()
  thumbnail?: string;
}
