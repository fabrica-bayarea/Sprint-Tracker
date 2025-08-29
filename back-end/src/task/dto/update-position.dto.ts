import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdatePositionDto {
  @ApiProperty({
    description: 'Posição da tarefa na lista',
    example: 1,
  })
  @IsNumber()
  newPosition: number;
}
