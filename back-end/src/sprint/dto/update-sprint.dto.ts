import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateSprintDto } from './create-sprint.dto';

export class UpdateSprintDto extends PartialType(CreateSprintDto) {
  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}
