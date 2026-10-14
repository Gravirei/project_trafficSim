'use client';

/**
 * History-aware back control for non-desk pages.
 * Uses browser history when available; otherwise falls back to a target.
 */
import { ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useViewController } from '@/hooks/useViewController';

export function NavBack({
  label = 'BACK',
  className,
  ariaLabel,
  fallback,
  children,
}: {
  label?: string;
  className?: string;
  ariaLabel?: string;
  fallback?: () => void;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { showLanding } = useViewController();

  const onClick = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallback) fallback();
    else showLanding();
  }, [router, fallback, showLanding]);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
    >
      {children ?? (
        <>
          <ArrowLeft size={14} strokeWidth={2} /> {label}
        </>
      )}
    </button>
  );
}
