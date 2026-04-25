import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class AddMemberDto {
  @ApiProperty({
    description: 'Email do usuário a ser adicionado ao board',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Papel do membro no board',
    enum: Role,
    default: Role.MEMBER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
