import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: Role, description: 'Novo cargo do membro' })
  @IsEnum(Role)
  role: Role;
}
