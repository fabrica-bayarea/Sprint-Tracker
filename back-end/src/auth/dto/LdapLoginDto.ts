import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LdapLoginDto {
  @ApiProperty({
    example: '20210001',
    description: 'Matrícula (enrollment) do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome de usuário não pode ser vazio.' })
  enrollment: string;

  @ApiProperty({
    example: 'sua_senha_segura',
    description: 'Senha do usuário',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  password: string;
}
