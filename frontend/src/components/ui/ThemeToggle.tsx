'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import styles from './ThemeToggle.module.css';

/**
 * Sun/moon button. Toggles the global light/dark theme.
 * Place in any topbar; styling is theme-aware via CSS module.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={isLight}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isLight ? (
        <Moon size={14} strokeWidth={2} />
      ) : (
        <Sun size={14} strokeWidth={2} />
      )}
    </button>
  );
}
