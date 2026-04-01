/**
 * FeedbackTable component - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * This is kept as a no-op stub to avoid breaking any remaining imports.
 */

'use client';

export default function FeedbackTable({ initialData: _initialData }: { initialData: any[] }) {
  return (
    <div style={{ border: '1px solid var(--border)', padding: '2rem', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>
        Customer signals are now shown on the main feedback page.
      </p>
    </div>
  );
}
