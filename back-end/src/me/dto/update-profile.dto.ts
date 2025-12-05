import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class updateProfileDto {
  @ApiProperty({ example: 'first name last name' })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @Matches(/^[A-Za-zÀ-ÿ\s]+$/, {
    message: 'O nome deve conter apenas letras e espaços',
  })
  name: string;

  @ApiProperty({ example: 'username' })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @Matches(/.*[a-zA-Z].*/, {
    message: 'O nome deve conter pelo menos uma letra',
  })
  userName: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail({}, { message: 'O email deve ser válido' })
  @IsOptional()
  email: string;
}
