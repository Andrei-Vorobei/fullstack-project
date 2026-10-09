import {
  IsByteLength,
  IsEmail,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  @MinLength(2, { message: 'Имя пользователя должно содержать минимум 2 символа' })
  @MaxLength(30, { message: 'Имя пользователя не должно превышать 30 символов' })
  username: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(200, { message: 'Описание не должно превышать 200 символов' })
  about?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUrl(
    { require_protocol: true },
    { message: 'Аватар должен содержать корректный URL с протоколом' },
  )
  @MaxLength(500, { message: 'URL аватара не должен превышать 500 символов' })
  avatar?: string;

  @IsEmail({}, { message: 'Укажите корректный адрес электронной почты' })
  @MaxLength(255, { message: 'Email не должен превышать 255 символов' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsByteLength(8, 72, {
    message: 'Пароль должен содержать от 8 до 72 байт в кодировке UTF-8',
  })
  password: string;
}
