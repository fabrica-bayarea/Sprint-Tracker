import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class MoveTaskOtherListDto {
  @ApiProperty({
    description: 'ID da lista para onde a tarefa será movida',
    example: '1234567890abcdef12345678',
  })
  @IsString()
  newListId: string;

  @ApiProperty({
    description: 'Posição da tarefa na lista',
    example: 1,
  })
  @IsNumber()
  newPosition: number;
}
