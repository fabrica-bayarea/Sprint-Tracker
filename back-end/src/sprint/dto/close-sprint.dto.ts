import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export enum IncompleteTasksAction {
  MOVE_TO_NEXT = 'MOVE_TO_NEXT',
  RETURN_TO_BACKLOG = 'RETURN_TO_BACKLOG',
  KEEP = 'KEEP',
}

export class CloseSprintDto {
  @ApiProperty({
    enum: IncompleteTasksAction,
    description:
      'O que fazer com tasks não concluídas: mover pra próxima sprint, voltar pro backlog (sprintId=null), ou deixar paradas no sprint encerrado.',
  })
  @IsEnum(IncompleteTasksAction)
  incompleteTasksAction!: IncompleteTasksAction;

  @ApiPropertyOptional({
    description:
      'Obrigatório quando incompleteTasksAction=MOVE_TO_NEXT. ID da sprint PLANNED de destino no mesmo board.',
  })
  @ValidateIf((o: CloseSprintDto) => o.incompleteTasksAction === 'MOVE_TO_NEXT')
  @IsString()
  @IsUUID()
  targetSprintId?: string;
}
