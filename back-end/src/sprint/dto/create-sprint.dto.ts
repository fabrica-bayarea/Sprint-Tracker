import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 12 - Login Refactor' })
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode estar vazio' })
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'Refatorar login e adicionar SSO',
    description: 'Objetivo da sprint',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @ApiProperty({ example: '2026-05-14T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-05-28T00:00:00.000Z' })
  @IsDateString()
  endDate!: string;
}
