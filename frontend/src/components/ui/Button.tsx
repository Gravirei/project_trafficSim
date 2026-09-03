'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'pri' | 'tb' | 'enter';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', className, ...rest },
  ref,
) {
  return <button ref={ref} className={[styles[variant], className].filter(Boolean).join(' ')} {...rest} />;
});
