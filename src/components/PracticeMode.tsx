import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../data/wordLists';
import { getRandomWords } from '../data/wordLists';
import { useSpeech } from '../hooks/useSpeech';
import WordPlayer from './WordPlayer';
import AnswerInput from './AnswerInput';
import CountdownTimer from './CountdownTimer';

interface Props {
  difficulty: Difficulty;
  onHome: () => void;
}

const TIMER_TOTAL = 25;

const difficultyColour: Record<Difficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export default function PracticeMode({ difficulty, onHome }: Props) {
  const { voicesReady, isSpeaking, speak, speakSentenceWithAccent } = useSpeech();
  const [words] = useState(() => getRandomWords(difficulty, 200));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [seconds, setSeconds] = useState(TIMER_TOTAL);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; timeTaken: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const word = words[index];

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          stopTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (timerStarted && seconds === 0 && !submitted) {
      handleSubmit(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timerStarted, submitted]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function handleFirstPlay() {
    setHasPlayed(true);
    setTimerStarted(true);
    startTimer();
  }

  function handleSubmit(timedOut = false) {
    if (submitted) return;
    stopTimer();
    const timeTaken = TIMER_TOTAL - seconds;
    const correct = !timedOut && input.trim().toLowerCase() === word.toLowerCase();
    setSubmitted(true);
    setResult({ correct, timeTaken });
  }

  function nextWord() {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setInput('');
    setHasPlayed(false);
    setTimerStarted(false);
    setSeconds(TIMER_TOTAL);
    setSubmitted(false);
    setResult(null);
    stopTimer();
    // Auto-play the next word
    setTimeout(() => {
      speak(words[nextIndex]);
      setHasPlayed(true);
      setTimerStarted(true);
      startTimer();
    }, 300);
  }

  if (!voicesReady) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔊</div>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading voices…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onHome} style={backBtnStyle}>← Home</button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            background: difficultyColour[difficulty] + '22',
            color: difficultyColour[difficulty],
            border: `2px solid ${difficultyColour[difficulty]}`,
            borderRadius: '8px',
            padding: '0.3rem 0.8rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>{difficulty}</span>
          <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.85rem', fontWeight: 600 }}>
            📝 Practice
          </span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Word #{index + 1}
        </h2>

        <CountdownTimer seconds={seconds} total={TIMER_TOTAL} started={timerStarted} />

        <WordPlayer
          word={word}
          speak={speak}
          speakSentenceWithAccent={speakSentenceWithAccent}
          isSpeaking={isSpeaking}
          onFirstPlay={handleFirstPlay}
          hasPlayed={hasPlayed}
        />

        {!submitted ? (
          <AnswerInput
            value={input}
            onChange={setInput}
            onSubmit={() => handleSubmit(false)}
            disabled={submitted || !hasPlayed}
            placeholder={hasPlayed ? 'Type your spelling here…' : 'Play the word first!'}
          />
        ) : (
          <ResultBanner result={result!} word={word} />
        )}

        {submitted && (
          <button onClick={nextWord} style={{
            padding: '0.85rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            minHeight: '52px',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            Next Word →
          </button>
        )}
      </div>
    </div>
  );
}

function ResultBanner({ result, word }: { result: { correct: boolean; timeTaken: number }; word: string }) {
  return (
    <div style={{
      background: result.correct ? '#f0fdf4' : '#fef2f2',
      border: `2px solid ${result.correct ? '#86efac' : '#fca5a5'}`,
      borderRadius: '14px',
      padding: '1.2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{result.correct ? '✅' : '❌'}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.correct ? '#15803d' : '#dc2626', marginBottom: '0.4rem' }}>
        {result.correct ? 'Correct!' : 'Not quite!'}
      </div>
      <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
        {result.timeTaken > 0
          ? `You answered in ${result.timeTaken} second${result.timeTaken !== 1 ? 's' : ''}`
          : 'Time ran out!'}
      </div>
      <div style={{ fontSize: '1rem', color: '#475569' }}>
        The correct spelling is: <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{word}</strong>
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  background: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  cursor: 'pointer',
  minHeight: '44px',
};
