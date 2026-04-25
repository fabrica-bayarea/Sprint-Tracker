import React from 'react';
import { PlusCircle } from 'lucide-react';
import styles from './style.module.css';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.MouseEventHandler<HTMLButtonElement>;
  extraActions?: React.ReactNode;
}

export default function Section({ title, children, actionButton, extraActions }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.title}>{title}</span>
        <div className={styles.headerActions}>
          {extraActions}
          {actionButton && (
            <button className={styles.criarButton} onClick={actionButton}>
              Criar <PlusCircle size={20} />
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
