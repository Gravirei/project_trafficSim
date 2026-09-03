'use client';

import { ChangeEvent } from 'react';
import styles from './Slider.module.css';

export interface SliderProps {
  label: string;
  value: number;
  valueLabel?: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
}

export function Slider({ label, value, valueLabel, unit, min, max, step = 1, onChange, onCommit }: SliderProps) {
  const onInput = (e: ChangeEvent<HTMLInputElement>) => onChange(+e.target.value);
  return (
    <div className={styles.sl}>
      <label>
        <span>{label}</span>
        <b>
          <span>{valueLabel ?? value}</span>
          {unit ? <span> {unit}</span> : null}
        </b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onInput}
        onBlur={(e) => onCommit?.(+e.target.value)}
      />
    </div>
  );
}
