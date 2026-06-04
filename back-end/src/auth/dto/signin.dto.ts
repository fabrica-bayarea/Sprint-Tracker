import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'username@gmail.com' })
  @IsEmail({}, { message: 'deve ser no modelo de email' })
  @IsNotEmpty({ message: 'preencha com seu email' })
  @IsString({ message: 'email deve ser uma string' })
  email!: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsNotEmpty({ message: 'Preencha com sua senha' })
  @IsString({ message: 'senha deve ser uma string' })
  password!: string;

  // `?` no TypeScript não faz a validação ser opcional — class-validator
  // ainda exige boolean se o decorator @IsBoolean estiver presente.
  // Sem @IsOptional, o front mandar undefined (checkbox não marcado)
  // virava 400 "deve ser um booleano".
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'deve ser um booleano' })
  rememberMe?: boolean;
}
