"use client";

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

import { getBasicSummary, getCompletedTasksSummary } from '@/lib/actions/analysis';
import { useWarningStore } from '@/lib/stores/warning';

import BasicSummary from './BasicSummary';
import CompletedTasks from './CompletedTasks';

import type { BasicSummaryResponse, CompletedSummaryResponse } from '@/lib/actions/analysis';

import styles from './style.module.css';

interface ReportsProps {
  boardId: string;
}

export default function Reports({ boardId }: ReportsProps) {
  const [basicSummary, setBasicSummary] = useState<BasicSummaryResponse | null>(null);
  const [completedSummary, setCompletedSummary] = useState<CompletedSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { showWarning } = useWarningStore();

  useEffect(() => {
    async function fetchBasicSummary() {
      setLoading(true);
      
      const basicResponse = await getBasicSummary(boardId);
      if (basicResponse.success && basicResponse.data) {
        setBasicSummary(basicResponse.data);
      } else if (!basicResponse.success) {
        showWarning(basicResponse.error || 'Erro ao carregar resumo básico', 'failed');
      }

      setLoading(false);
    }

    fetchBasicSummary();
  }, [boardId, showWarning]);

  useEffect(() => {
    async function fetchCompletedSummary() {
      const completedResponse = await getCompletedTasksSummary(boardId, startDate, endDate);
      if (completedResponse.success && completedResponse.data) {
        setCompletedSummary(completedResponse.data);
      } else if (!completedResponse.success) {
        showWarning(completedResponse.error || 'Erro ao carregar relatório de conclusões', 'failed');
      }
    }

    fetchCompletedSummary();
  }, [boardId, startDate, endDate, showWarning]);

  const handleDateChange = async () => {
    const completedResponse = await getCompletedTasksSummary(boardId, startDate, endDate);
    if (completedResponse.success && completedResponse.data) {
      setCompletedSummary(completedResponse.data);
    } else if (!completedResponse.success) {
      showWarning(completedResponse.error || 'Erro ao carregar relatório de conclusões', 'failed');
    }
  };

  if (loading) {
    return (
      <div className={styles.reportsContainer}>
        <div className={styles.loadingState}>
          <Clock size={48} />
          <p>Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.reportsGrid}>
        <BasicSummary data={basicSummary} />
        <CompletedTasks 
          data={completedSummary}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDateBlur={handleDateChange}
        />
      </div>
    </div>
  );
}
