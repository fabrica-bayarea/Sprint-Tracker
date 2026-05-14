import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean } from 'class-validator';

export class ResponseInviteBoardDto {
  @ApiProperty({
    example: '12345',
    description: 'ID do convite que será respondido',
  })
  @IsNotEmpty({ message: 'O ID do convite não pode estar vazio' })
  idInvite: string;

  @ApiProperty({
    example: 'true',
    description: 'Resposta ao convite, true para aceitar e false para recusar',
  })
  @IsBoolean({ message: 'A resposta deve ser um valor booleano' })
  response: boolean;
}
