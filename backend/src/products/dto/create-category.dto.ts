import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Matches(/[\u0410-\u042f\u0451]/iu, { message: "Название должно быть на русском языке" })
  @Matches(/^[\u0410-\u042f\u0430-\u044f\u0401\u04510-9][\u0410-\u042f\u0430-\u044f\u0401\u04510-9 .,&()-]*$/u, {
    message: "Название может содержать только русские буквы, цифры и знаки препинания",
  })
  @Matches(/\S/)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug должен содержать только латинские строчные буквы, цифры и дефисы",
  })
  @MaxLength(100)
  slug: string;
}
