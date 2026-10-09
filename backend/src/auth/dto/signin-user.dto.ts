import { IsByteLength, IsEmail, IsString, MaxLength } from 'class-validator';

export class SigninUserDto {
  @IsEmail({}, { message: 'Укажите корректный адрес электронной почты' })
  @MaxLength(255, { message: 'Email не должен превышать 255 символов' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsByteLength(1, 72, {
    message: 'Пароль должен содержать не более 72 байт в кодировке UTF-8',
  })
  password: string;
}
