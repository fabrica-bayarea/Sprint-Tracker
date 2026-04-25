import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { BacklogPriority } from '../../common/enums/backlog-priority.enum';
import { BacklogStatus } from '../../common/enums/backlog-status.enum';

export class CreateBacklogDto {
  @ApiProperty({
    example: 'boardId123',
    description: 'ID do quadro ao qual este backlog pertence',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  boardId!: string;

  @ApiProperty({
    example: 'Backlog do projeto',
    description: 'O título do backlog',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Isso é um backlog de exemplo',
    description: 'Uma descrição opcional do backlog',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Prioridade do backlog',
    required: true,
  })
  @IsEnum(BacklogPriority)
  @IsNotEmpty()
  priority!: BacklogPriority;

  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Status do backlog',
    required: true,
  })
  @IsEnum(BacklogStatus)
  @IsNotEmpty()
  status!: BacklogStatus;
}
