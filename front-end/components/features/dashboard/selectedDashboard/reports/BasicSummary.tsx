"use client";

import React from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';

import type { BasicSummaryResponse } from '@/lib/actions/analysis';

import styles from './style.module.css';

interface BasicSummaryProps {
  data: BasicSummaryResponse | null;
}

export default function BasicSummary({ data }: BasicSummaryProps) {
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'TODO': 'A Fazer',
      'IN_PROGRESS': 'Em Progresso',
      'DONE': 'Concluído',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'TODO': '#6b7280',
      'IN_PROGRESS': '#3b82f6',
      'DONE': '#10b981',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <section className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <BarChart3 size={24} />
        <h2 className={styles.cardTitle}>Resumo Geral</h2>
      </div>
      
      {data ? (
        <>
          <div className={styles.totalTasks}>
            <span className={styles.totalLabel}>Total de Tarefas</span>
            <span className={styles.totalValue}>{data.total}</span>
          </div>

          <div className={styles.statusList}>
            {data.statusCounts.map((statusCount) => (
              <div key={statusCount.status} className={styles.statusItem}>
                <div className={styles.statusHeader}>
                  <span 
                    className={styles.statusDot} 
                    style={{ backgroundColor: getStatusColor(statusCount.status) }}
                  />
                  <span className={styles.statusLabel}>
                    {getStatusLabel(statusCount.status)}
                  </span>
                </div>
                <div className={styles.statusStats}>
                  <span className={styles.statusCount}>{statusCount.count}</span>
                  <span className={styles.statusPercentage}>
                    {statusCount.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${statusCount.percentage}%`,
                      backgroundColor: getStatusColor(statusCount.status)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={32} />
          <p>Não foi possível carregar o resumo</p>
        </div>
      )}
    </section>
  );
}
