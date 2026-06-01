import React, { useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  maxLetters: number;
  placeholder?: string;
}

export default function AnswerInput({ value, onChange, onSubmit, disabled, maxLetters, placeholder }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Derive individual box values from the joined string value.
  // Empty boxes contribute '' so join() correctly reconstructs just the typed letters.
  const letters = Array.from({ length: maxLetters }, (_, i) => value[i] ?? '');

  // Focus first empty box when enabled
  useEffect(() => {
    if (disabled) return;
    const firstEmpty = letters.findIndex(l => l === '');
    const target = firstEmpty === -1 ? maxLetters - 1 : firstEmpty;
    refs.current[target]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, maxLetters]);

  const updateValue = useCallback((newLetters: string[]) => {
    // Join without separators — trailing empty boxes become nothing
    onChange(newLetters.join(''));
  }, [onChange]);

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/[^a-zA-Z]/g, '').slice(-1).toLowerCase();
    const newLetters = [...letters];
    newLetters[i] = char;
    updateValue(newLetters);
    if (char && i < maxLetters - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (letters[i]) {
        const newLetters = [...letters];
        newLetters[i] = '';
        updateValue(newLetters);
      } else if (i > 0) {
        const newLetters = [...letters];
        newLetters[i - 1] = '';
        updateValue(newLetters);
        refs.current[i - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < maxLetters - 1) {
      refs.current[i + 1]?.focus();
    } else if (e.key === 'Enter' && value.length > 0 && !disabled) {
      onSubmit();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const newLetters = Array.from({ length: maxLetters }, (_, i) => pasted[i] ?? '');
    updateValue(newLetters);
    const lastFilled = Math.min(pasted.length, maxLetters) - 1;
    refs.current[Math.max(0, lastFilled)]?.focus();
  }

  function handleFocus(i: number) {
    refs.current[i]?.select();
  }

  const hasAnyLetter = value.length > 0;

  // Scale box size so long words fit on mobile screens
  const boxSize = maxLetters <= 7 ? 52
    : maxLetters <= 10 ? 44
    : maxLetters <= 14 ? 36
    : 30;
  const fontSize = boxSize >= 46 ? '1.4rem'
    : boxSize >= 38 ? '1.15rem'
    : boxSize >= 32 ? '0.95rem'
    : '0.8rem';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem', width: '100%' }}>

      {placeholder && !hasAnyLetter && !disabled && (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>{placeholder}</p>
      )}

      {/* Letter boxes */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
      }}>
        {letters.map((letter, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            value={letter}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(i)}
            disabled={disabled}
            maxLength={2}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            autoSave="off"
            spellCheck={false}
            inputMode="text"
            type="text"
            style={{
              width: `${boxSize}px`,
              height: `${boxSize}px`,
              fontSize,
              fontWeight: 700,
              textAlign: 'center',
              border: `2px solid ${letter ? '#6366f1' : '#cbd5e1'}`,
              borderRadius: '8px',
              outline: 'none',
              background: disabled ? '#f1f5f9' : letter ? '#eef2ff' : '#fff',
              color: '#1e293b',
              caretColor: 'transparent',
              cursor: disabled ? 'not-allowed' : 'text',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          />
        ))}
      </div>

      {/* Hint that not all boxes need to be filled */}
      <p style={{
        color: '#94a3b8',
        fontSize: '0.78rem',
        margin: 0,
        fontStyle: 'italic',
      }}>
        Not all boxes need to be filled in
      </p>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={disabled || !hasAnyLetter}
        style={{
          padding: '0.85rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 700,
          background: disabled || !hasAnyLetter ? '#94a3b8' : '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          cursor: disabled || !hasAnyLetter ? 'not-allowed' : 'pointer',
          minHeight: '52px',
          minWidth: '160px',
          boxShadow: hasAnyLetter && !disabled ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
          transition: 'background 0.2s',
        }}
      >
        ✅ Submit
      </button>
    </div>
  );
}
