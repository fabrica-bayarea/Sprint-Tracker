import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'username@gmail.com' })
  @IsEmail({}, { message: 'deve ser no modelo de email' })
  email!: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsNotEmpty({ message: 'preencha com sua senha' })
  @IsString({ message: 'senha deve ser uma string' })
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'deve ser um booleano' })
  @IsNotEmpty({ message: 'preencha o campo de lembrar de mim' })
  rememberMe?: boolean;
}
