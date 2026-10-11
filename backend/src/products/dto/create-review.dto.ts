import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Matches(/\S/)
  @MaxLength(5000)
  comment: string;
}
