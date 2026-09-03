'use client';

import { ReactNode } from 'react';
import styles from './Topbar.module.css';

export function Topbar({ children }: { children: ReactNode }) {
  return <header className={styles.topbar}>{children}</header>;
}
