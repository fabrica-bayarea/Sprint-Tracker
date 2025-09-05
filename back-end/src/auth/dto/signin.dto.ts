import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'username@gmail.com' })
  @IsEmail({}, { message: 'deve ser no modelo de email' })
  @IsNotEmpty({ message: 'preencha com seu email' })
  @IsString({ message: 'email deve ser uma string' })
  email: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsNotEmpty({ message: 'Preencha com sua senha' })
  @IsString({ message: 'senha deve ser uma string' })
  password: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'deve ser um booleano' })
  rememberMe: boolean;
}
