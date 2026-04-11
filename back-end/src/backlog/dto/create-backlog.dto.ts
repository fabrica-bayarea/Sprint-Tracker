import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { SpringBacklogItemDto } from '../../sprintbacklogitem/dto/sprintbacklogitem.dto';
import { BacklogPriority } from '../../common/enums/backlog-priority.enum';
import { BacklogStatus } from '../../common/enums/backlog-status.enum';
import { Type } from 'class-transformer';

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

  @ApiProperty({
    example: [
      {
        sprintid: 'sprintId123',
        backlogid: 'backlogId123',
        completedAt: '2026-03-03T00:00:00.000Z',
      },
    ],
    description: 'Lista de sprints associadas a este backlog',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SpringBacklogItemDto)
  sprints!: SpringBacklogItemDto[];
}
