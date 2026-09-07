'use client';

import { ReactNode } from 'react';
import styles from './Panel.module.css';

export function Panel({
  children,
  className,
  onClick,
  title,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <aside
      className={[styles.panel, className].filter(Boolean).join(' ')}
      onClick={onClick}
      title={title}
    >
      {children}
    </aside>
  );
}

export function PanelHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className={styles.ph}>
      <span>{children}</span>
      {right}
    </div>
  );
}

export function Block({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.blk, className].filter(Boolean).join(' ')}>{children}</div>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <div className={styles.hint}>{children}</div>;
}
