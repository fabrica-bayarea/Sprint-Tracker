import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GenerateAuthTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsNotEmpty({ message: 'O token de acesso não pode estar vazio' })
  @IsString({ message: 'O token de acesso deve ser uma string' })
  accessToken: string;

  @ApiProperty({ example: '3600' })
  @IsNotEmpty({ message: 'O tempo de expiração não pode estar vazio' })
  @IsString({ message: 'O tempo de expiração deve ser uma string' })
  expiresIn: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsNotEmpty({ message: 'A data de criação não pode estar vazia' })
  createdAt: string;
}

export class UserInfoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'O id não pode estar vazio' })
  @IsNumber({}, { message: 'O id deve ser um número' })
  id: number;

  @ApiProperty({ example: 'first name last name' })
  @IsNotEmpty({ message: 'Preencha o campo de nome completo' })
  @IsString({ message: 'O nome deve ser uma string' })
  fullName: string;

  @ApiProperty({ example: 'username' })
  @IsNotEmpty({ message: 'Preencha o campo de nome de usuario' })
  @IsString({ message: 'O nome deve ser uma string' })
  userName: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail({}, { message: 'O email deve ser válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;
}

export class SignResponseJwtDto {
  @ApiProperty({ type: GenerateAuthTokenDto })
  @IsNotEmpty({ message: 'Os dados de acesso não podem estar vazios' })
  access: GenerateAuthTokenDto;

  @ApiProperty({ type: UserInfoDto })
  @IsNotEmpty({ message: 'Os dados do usuário não podem estar vazios' })
  user: UserInfoDto;
}

export class providerUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'O google_id não pode estar vazio' })
  @IsString({ message: 'O google_id deve ser uma string' })
  provider_id: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail({}, { message: 'O email deve ser válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;

  @ApiProperty({ example: 'Nome Completo' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @ApiProperty({ example: 'ya29.a0AfH6SM...' })
  @IsNotEmpty({ message: 'O access_token não pode estar vazio' })
  @IsString({ message: 'O access_token deve ser uma string' })
  access_token: string;
}
