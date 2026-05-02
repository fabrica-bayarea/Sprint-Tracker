import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

import { TaskStatus } from '@/common/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'ID da lista à qual a tarefa pertence',
    example: '1234567890abcdef12345678',
  })
  @IsString()
  listId!: string;

  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Implementar a funcionalidade de autenticação',
  })
  @IsString()
  title!: string;

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
    required: true,
  })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiProperty({
    description: 'Data de criação da tarefa',
    example: '2023-10-01T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({
    description:
      'ID do membro do board responsável pela tarefa (apenas admin/owner pode atribuir)',
    example: '1234567890abcdef12345678',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  assigneeId?: string | null;
}
