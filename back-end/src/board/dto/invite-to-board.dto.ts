import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum RoleUserBoard {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  OBSERVER = 'OBSERVER',
}

export class InviteBoardDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Nome do usuário que será convidado',
  })
  @IsNotEmpty({ message: 'O nome do usuário não pode estar vazio' })
  userName: string;

  @ApiProperty({
    example: 'OBSERVER',
    description:
      'Permissão do usuário no quadro. Pode ser ADMIN, MEMBER ou OBSERVER',
    enum: RoleUserBoard,
  })
  @IsOptional()
  @IsEnum(RoleUserBoard)
  role: RoleUserBoard;
}
