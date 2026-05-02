import { CreateBacklogDto } from './create-backlog.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateBacklogDto extends PartialType(CreateBacklogDto) {}
