import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { Match } from 'src/utils/match.decorator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'StrongP@ssword123' })
  @IsString({ message: 'A nova senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A nova senha não pode ser vazia.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  @IsStrongPassword(
    {},
    {
      message:
        'A nova senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
    },
  )
  newPassword: string;

  @ApiProperty({ example: 'StrongP@ssword123' })
  @IsString({ message: 'A confirmação da senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A confirmação da senha não pode ser vazia.' })
  @MinLength(8, {
    message: 'A confirmação da senha deve ter no mínimo 8 caracteres.',
  })
  @Match('newPassword', {
    message: 'As senhas não coincidem.',
  })
  confirmNewPassword: string;
}
