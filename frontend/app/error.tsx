'use client';

import { useEffect } from 'react';

/**
 * App-level error boundary (Next.js 15 convention).
 * Catches errors thrown in Server / Client Components inside the app.
 * Server boundary lives in `global-error.tsx` for layout-level crashes.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.error('[app-error]', error);
    }
  }, [error]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: 480, width: '100%',
        background: 'white',
        borderRadius: 20,
        border: '1px solid rgba(10, 10, 10, 0.06)',
        boxShadow: '0 1px 3px rgba(10, 10, 10, 0.04), 0 24px 48px -12px rgba(79, 70, 229, 0.10)',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div aria-hidden="true" style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          border: '1px solid rgba(79, 70, 229, 0.18)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#4F46E5', marginBottom: 20,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: '#0A0A0A',
          letterSpacing: '-0.025em', marginBottom: 10,
        }}>
          Something went wrong on our side
        </h1>
        <p style={{
          fontSize: 14, lineHeight: 1.6, color: '#525252',
          marginBottom: 24, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto',
        }}>
          We&rsquo;ve logged the issue. You can retry, or head back home — your data is saved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '11px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.32)',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '11px 22px', borderRadius: 12,
              border: '1px solid rgba(10, 10, 10, 0.10)',
              background: 'white', color: '#0A0A0A',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            Back to homepage
          </a>
        </div>
        {error.digest && (
          <div style={{ fontSize: 11, color: '#A3A3A3', marginTop: 20, fontFamily: 'monospace' }}>
            Error ID: {error.digest}
          </div>
        )}
      </div>
    </main>
  );
}
