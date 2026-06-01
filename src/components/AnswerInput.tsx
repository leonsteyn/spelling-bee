import React, { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder?: string;
}

export default function AnswerInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !disabled) onSubmit();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder ?? 'Type your spelling here…'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '0.85rem 1.2rem',
          fontSize: '1.4rem',
          fontWeight: 600,
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          outline: 'none',
          textAlign: 'center',
          letterSpacing: '0.05em',
          background: disabled ? '#f1f5f9' : '#fff',
          color: '#1e293b',
          boxSizing: 'border-box',
        }}
      />
      <button
        onClick={onSubmit}
        disabled={disabled || value.trim() === ''}
        style={{
          padding: '0.85rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 700,
          background: disabled || value.trim() === '' ? '#94a3b8' : '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          cursor: disabled || value.trim() === '' ? 'not-allowed' : 'pointer',
          minHeight: '52px',
          minWidth: '160px',
          boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
          transition: 'background 0.2s',
        }}
      >
        ✅ Submit
      </button>
    </div>
  );
}
