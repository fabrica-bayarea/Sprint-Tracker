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
  // Se a validação falhar, retorna o valor para que o @IsDate lance o erro de validação.
  return value;
};

/**
 * DTO para filtrar o resumo de tarefas concluídas por período e filtros opcionais.
 */
export class GetCompletedSummaryDto {
  /**
   * Data de início do período (ISO 8601 string).
   * Exemplo: '2025-10-01'
   */
  @IsOptional()
  @Transform(toDate)
  @IsDate({ message: 'startDate deve ser uma data válida.' })
  startDate?: Date;

  /**
   * Data de fim do período (ISO 8601 string).
   * Exemplo: '2025-10-31'
   */
  @IsOptional()
  @Transform(toDate)
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida.' })
  endDate?: Date;

  /**
   * Filtro opcional pelo ID do usuário (pessoa).
   */
  @IsOptional()
  @IsUUID('4', { message: 'userId deve ser um UUID válido.' })
  userId?: string;

  /**
   * Filtro opcional pelo ID do Board.
   */
  @IsOptional()
  @IsUUID('4', { message: 'boardId deve ser um UUID válido.' })
  boardId?: string;

  /**
   * Filtro opcional pelo ID da Lista.
   */
  @IsOptional()
  @IsUUID('4', { message: 'listId deve ser um UUID válido.' })
  listId?: string;
}
