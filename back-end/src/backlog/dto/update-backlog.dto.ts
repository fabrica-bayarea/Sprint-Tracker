import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BacklogPriority } from '../../common/enums/backlog-priority.enum';
import { BacklogStatus } from '../../common/enums/backlog-status.enum';

export class UpdateBacklogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BacklogPriority)
  priority?: BacklogPriority;

  @IsOptional()
  @IsEnum(BacklogStatus)
  status?: BacklogStatus;
}
