import React from 'react';
import { PlusCircle } from 'lucide-react';
import styles from './style.module.css';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Section({ title, children, actionButton }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.title}>{title}</span>
        {actionButton && (
          <button className={styles.criarButton} onClick={actionButton}>
            Criar <PlusCircle size={20} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
