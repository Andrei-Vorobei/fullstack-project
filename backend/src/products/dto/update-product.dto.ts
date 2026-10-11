import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProductDimensionsDto } from './create-product.dto.js';
import { CURRENCY_CODES, type CurrencyCode } from '../../currencies/entities/currency.entity.js';

const AVAILABILITY_STATUSES = ['In Stock', 'Out of Stock', 'Low Stock'] as const;

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  brand?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus?: (typeof AVAILABILITY_STATUSES)[number];

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
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images?: string[];
}
