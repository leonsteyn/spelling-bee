import React, { useState } from 'react';
import type { Difficulty } from '../data/wordLists';
import { difficulties } from '../data/wordLists';

interface Props {
  onStart: (mode: 'practice' | 'test', difficulty: Difficulty, wordCount?: number) => void;
}

const difficultyColour: Record<Difficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

const difficultyDesc: Record<Difficulty, string> = {
  beginner: 'Simple everyday words — great for starting out!',
  intermediate: 'A bit trickier — for growing spellers.',
  advanced: 'Challenging words for confident spellers.',
};

export default function HomeScreen({ onStart }: Props) {
  const [mode, setMode] = useState<'practice' | 'test' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [wordCount, setWordCount] = useState<10 | 15 | 20>(10);

  const canStart = mode && difficulty && (mode === 'practice' || wordCount);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '0.25rem' }}>🐝</div>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.25rem' }}>
        Spelling Bee
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '2rem' }}>
        Australian Primary School Edition
      </p>

      {/* Mode */}
      <Section title="1. Choose a Mode">
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {(['practice', 'test'] as const).map(m => (
            <ModeCard
              key={m}
              selected={mode === m}
              onClick={() => setMode(m)}
              label={m === 'practice' ? '📝 Practice' : '🏆 Test'}
              desc={m === 'practice'
                ? 'Learn at your own pace. No pressure!'
                : 'Race the clock and earn points!'}
            />
          ))}
        </div>
      </Section>

      {/* Difficulty */}
      <Section title="2. Choose a Difficulty">
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                padding: '0.8rem 1.4rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: `3px solid ${difficulty === d ? difficultyColour[d] : '#e2e8f0'}`,
                background: difficulty === d ? difficultyColour[d] + '22' : '#f8fafc',
                color: difficulty === d ? difficultyColour[d] : '#475569',
                cursor: 'pointer',
                minWidth: '140px',
                minHeight: '80px',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}>{d}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#64748b', textAlign: 'center' }}>
                {difficultyDesc[d]}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Word count (test only) */}
      {mode === 'test' && (
        <Section title="3. Number of Words">
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {([10, 15, 20] as const).map(n => (
              <button
                key={n}
                onClick={() => setWordCount(n)}
                style={{
                  padding: '0.7rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: `3px solid ${wordCount === n ? '#6366f1' : '#e2e8f0'}`,
                  background: wordCount === n ? '#6366f122' : '#f8fafc',
                  color: wordCount === n ? '#6366f1' : '#475569',
                  cursor: 'pointer',
                  minHeight: '52px',
                  minWidth: '72px',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </Section>
      )}

      <button
        disabled={!canStart}
        onClick={() => canStart && onStart(mode!, difficulty!, mode === 'test' ? wordCount : undefined)}
        style={{
          marginTop: '1.5rem',
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          fontWeight: 800,
          background: canStart ? '#6366f1' : '#94a3b8',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          cursor: canStart ? 'pointer' : 'not-allowed',
          minHeight: '56px',
          boxShadow: canStart ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
        }}
      >
        🚀 Let's Go!
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ModeCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '1rem 1.5rem',
        fontSize: '1.05rem',
        fontWeight: 700,
        borderRadius: '14px',
        border: `3px solid ${selected ? '#6366f1' : '#e2e8f0'}`,
        background: selected ? '#6366f122' : '#f8fafc',
        color: selected ? '#6366f1' : '#475569',
        cursor: 'pointer',
        minWidth: '160px',
        minHeight: '90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '1.3rem' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>{desc}</span>
    </button>
  );
}
