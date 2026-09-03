'use client';

import { ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipColor = 'mut' | 'cG' | 'cY' | 'cR' | 'cP' | 'cE';

export function Chip({
  children,
  color = 'mut',
  className,
}: {
  children: ReactNode;
  color?: ChipColor;
  className?: string;
}) {
  return <span className={[styles.chip, styles[color], className].filter(Boolean).join(' ')}>{children}</span>;
}
