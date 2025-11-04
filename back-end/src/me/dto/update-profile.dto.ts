import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ProfileDto {
  @ApiProperty({ example: 'first name last name' })
  @IsNotEmpty({ message: 'Preencha o campo com o seu nome completo' })
  @IsString({ message: 'O nome deve ser uma string' })
  @Matches(/^[A-Za-zÀ-ÿ\s]+$/, {
    message: 'O nome deve conter apenas letras e espaços',
  })
  name: string;

  @ApiProperty({ example: 'username' })
  @IsNotEmpty({ message: 'Preencha o campo de nome de usuario' })
  @IsString({ message: 'O nome deve ser uma string' })
  @Matches(/.*[a-zA-Z].*/, {
    message: 'O nome deve conter pelo menos uma letra',
  })
  userName: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail({}, { message: 'O email deve ser válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;
}
