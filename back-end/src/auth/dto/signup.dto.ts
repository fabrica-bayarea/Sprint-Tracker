import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsStrongPassword,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'first name last name' })
  @IsNotEmpty({ message: 'Preencha o campo de nome completo' })
  @IsString({ message: 'O nome deve ser uma string' })
  name!: string;

  @ApiProperty({ example: 'username' })
  @IsNotEmpty({ message: 'Preencha o campo de nome de usuario' })
  @IsString({ message: 'O nome deve ser uma string' })
  userName!: string;

  @ApiProperty({ example: 'username@gmail.com' })
  @IsEmail({}, { message: 'Preencha o campo de email' })
  @IsString({ message: 'O email deve ser uma string' })
  email!: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsString({ message: 'A senha deve ser uma string' })
  @IsStrongPassword(
    {},
    {
      message:
        'Senha deve ter 8 caracteres, 1 especial, 1 número e uma letra maiúscula',
    },
  )
  password!: string;
}
