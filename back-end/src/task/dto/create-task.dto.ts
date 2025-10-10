import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

import { TaskStatus } from '@/common/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'ID da lista à qual a tarefa pertence',
    example: '1234567890abcdef12345678',
  })
  @IsString()
  listId: string;

  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Implementar a funcionalidade de autenticação',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Descrição da tarefa',
    example: 'Implementar a funcionalidade de autenticação com JWT',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Status da tarefa',
    example: 'TODO',
  })
  @IsString()
  status: TaskStatus;

  @ApiProperty({
    description: 'Data de criação da tarefa',
    example: '2023-10-01T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
