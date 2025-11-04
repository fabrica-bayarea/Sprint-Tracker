import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

import { Match } from '@/utils/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty({ message: 'A senha não pode ser omitida' })
  @IsString({ message: 'A senha deve ser uma string' })
  oldPassword: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty({ message: 'A nova senha não pode ser omitida' })
  @IsString({ message: 'A nova senha deve ser uma string' })
  @IsStrongPassword(
    {},
    {
      message:
        'A nova senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
    },
  )
  newPassword: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty({ message: 'A confirmação da senha não pode ser omitida' })
  @IsString({ message: 'A confirmação da senha deve ser uma string' })
  @IsStrongPassword(
    {},
    {
      message:
        'A confirmação da senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
    },
  )
  @Match('newPassword', {
    message: 'As senhas não coincidem.',
  })
  confirmNewPassword: string;
}
