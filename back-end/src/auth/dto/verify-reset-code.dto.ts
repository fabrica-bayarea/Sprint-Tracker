import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    example: '12345678-l',
    description: 'Código de verificação para redefinição de senha',
  })
  @IsNotEmpty({ message: 'O código de verificação não pode estar vazio.' })
  @IsString({ message: 'O código de verificação deve ser uma string.' })
  code!: string;
}
