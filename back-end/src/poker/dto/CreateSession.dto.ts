import { ApiProperty } from '@nestjs/swagger';
import { PokerStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePokerSessionDTO {
  @ApiProperty({
    example: 'Sessão Poker teste 01',
    description: 'Título da sessão',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Status da sessão',
    enum: PokerStatus,
    default: PokerStatus.WAITING,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(PokerStatus)
  status!: PokerStatus;

  @ApiProperty({
    example: 'taskId caso já tenha uma task criada',
  })
  @IsOptional()
  @IsString()
  taskId?: string;
}
