"use client";

import React from 'react';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

import type { CompletedSummaryResponse } from '@/lib/actions/analysis';

import styles from './style.module.css';

interface CompletedTasksProps {
  data: CompletedSummaryResponse | null;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDateBlur: () => void;
}

export default function CompletedTasks({ 
  data, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onDateBlur 
}: CompletedTasksProps) {
  return (
    <section className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <TrendingUp size={24} />
        <h2 className={styles.cardTitle}>Tarefas Concluídas</h2>
      </div>

      <div className={styles.dateFilters}>
        <div className={styles.dateInput}>
          <label htmlFor="startDate">De:</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            onBlur={onDateBlur}
            className={styles.input}
          />
        </div>
        <div className={styles.dateInput}>
          <label htmlFor="endDate">Até:</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            onBlur={onDateBlur}
            className={styles.input}
          />
        </div>
      </div>

      {data ? (
        <>
          <div className={styles.completedTotal}>
            <CheckCircle2 size={20} />
            <span>Total concluído: <strong>{data.total}</strong> tarefas</span>
          </div>

          {data.dailyCounts.length > 0 ? (
            <div className={styles.dailyCountsList}>
              {data.dailyCounts.slice(-10).map((daily) => (
                <div key={daily.date} className={styles.dailyCountItem}>
                  <span className={styles.dailyDate}>
                    {new Date(daily.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                  <div className={styles.dailyBar}>
                    <div 
                      className={styles.dailyBarFill}
                      style={{ 
                        width: `${(daily.count / Math.max(...data.dailyCounts.map(d => d.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className={styles.dailyCount}>{daily.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <AlertCircle size={32} />
              <p>Nenhuma tarefa concluída no período selecionado</p>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={32} />
          <p>Não foi possível carregar o relatório</p>
        </div>
      )}
    </section>
  );
}
