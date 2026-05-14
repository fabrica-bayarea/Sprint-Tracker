import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

export interface DailyCompletedCount {
  date: string; // Ex: '2025-10-15'
  count: number;
}

export interface CompletedSummaryResponse {
  total: number;
  dailyCounts: DailyCompletedCount[];
}

const toDate = (params: { value: string }) => {
  const { value } = params;

  if (value && !isNaN(new Date(value).getTime())) {
    return new Date(value);
  }

  return value;
};

export class GetCompletedSummaryDto {
  @IsOptional()
  @Transform(toDate)
  @IsDate({ message: 'startDate deve ser uma data válida.' })
  startDate: Date;

  @IsOptional()
  @Transform(toDate)
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida.' })
  endDate: Date;

  @IsOptional()
  @IsUUID('4', { message: 'userId deve ser um UUID válido.' })
  userId?: string;
}
