import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePokerSessionDTO {
  @ApiProperty({
    example: 'Sessão Poker teste 01',
    description: 'Título da sessão',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'taskId caso já tenha uma task criada',
  })
  @IsOptional()
  @IsString()
  taskId?: string;
}
