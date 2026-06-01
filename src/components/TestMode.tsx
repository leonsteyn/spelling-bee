import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../data/wordLists';
import { getRandomWords } from '../data/wordLists';
import { useSpeech } from '../hooks/useSpeech';
import WordPlayer from './WordPlayer';
import AnswerInput from './AnswerInput';
import CountdownTimer from './CountdownTimer';
import ResultsScreen from './ResultsScreen';
import type { WordResult } from './ResultsScreen';

interface Props {
  difficulty: Difficulty;
  wordCount: number;
  onHome: () => void;
}

const TIMER_TOTAL = 25;

const MAX_LETTERS: Record<Difficulty, number> = {
  beginner: 7,
  intermediate: 10,
  advanced: 17,
};

const difficultyColour: Record<Difficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TestMode({ difficulty, wordCount, onHome }: Props) {
  const { voicesReady, isSpeaking, speak, speakSentenceWithAccent } = useSpeech();
  const [words] = useState(() => getRandomWords(difficulty, wordCount));

  // testStarted: false = show "Start Test" splash; true = in progress
  const [testStarted, setTestStarted] = useState(false);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);
  const [seconds, setSeconds] = useState(TIMER_TOTAL);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<WordResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalStartedRef = useRef(false);
  // track whether the current word has been spoken at least once (for replay label)
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const stopWordTimer = useCallback(() => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }, []);

  const startWordTimer = useCallback(() => {
    if (wordTimerRef.current) return;
    setTimerStarted(true);
    wordTimerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          stopWordTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [stopWordTimer]);

  function startTotalTimer() {
    if (totalStartedRef.current) return;
    totalStartedRef.current = true;
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(e => e + 1);
    }, 1000);
  }

  function stopTotalTimer() {
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  }

  useEffect(() => () => { stopWordTimer(); stopTotalTimer(); }, [stopWordTimer]);

  // Auto-submit on word timer expiry
  useEffect(() => {
    if (timerStarted && seconds === 0 && !submitted) {
      doSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timerStarted, submitted]);

  /** Play the word at the given index and kick off timers */
  const playWord = useCallback((wordIndex: number) => {
    speak(words[wordIndex]);
    setHasAutoPlayed(true);
    startWordTimer();
    startTotalTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, startWordTimer, words]);

  /** Called when "Start Test" is clicked */
  function handleStartTest() {
    setTestStarted(true);
    // speak is async-safe; voicesReady is guaranteed true here
    setTimeout(() => playWord(0), 300);
  }

  function doSubmit(timedOut: boolean) {
    if (submitted) return;
    stopWordTimer();
    const timeTaken = TIMER_TOTAL - seconds;
    const word = words[index];
    const correct = !timedOut && input.trim().toLowerCase() === word.toLowerCase();
    const points = correct ? Math.max(1, 25 - timeTaken) : 0;
    const result: WordResult = {
      word,
      typed: timedOut ? '' : input.trim(),
      correct,
      timeTaken: timedOut ? 25 : timeTaken,
      points,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setSubmitted(true);

    const nextIndex = index + 1;

    setTimeout(() => {
      if (nextIndex >= wordCount) {
        stopTotalTimer();
        setFinished(true);
      } else {
        // Reset for next word
        setIndex(nextIndex);
        setInput('');
        setTimerStarted(false);
        setSeconds(TIMER_TOTAL);
        setSubmitted(false);
        setHasAutoPlayed(false);
        // Auto-play the next word after state has flushed
        setTimeout(() => playWord(nextIndex), 150);
      }
    }, 600);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!voicesReady) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔊</div>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading voices…</p>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (finished) {
    return (
      <ResultsScreen
        results={results}
        totalElapsed={totalElapsed}
        onHome={onHome}
        onRetry={onHome}
      />
    );
  }

  // ── Start splash ───────────────────────────────────────────────────────────
  if (!testStarted) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
        <button onClick={onHome} style={{ ...backBtnStyle, marginBottom: '2rem', display: 'block' }}>← Home</button>

        <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 4px 28px rgba(0,0,0,0.09)', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.5rem' }}>
            Ready for the Test?
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            You'll hear each word spoken aloud. Type it in and submit before the 25-second timer runs out. No peeking at results until the end!
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Chip label={`${wordCount} words`} colour="#6366f1" />
            <Chip label={difficulty} colour={difficultyColour[difficulty]} />
            <Chip label="25s per word" colour="#f59e0b" />
          </div>

          <button
            onClick={handleStartTest}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.25rem',
              fontWeight: 800,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              minHeight: '56px',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              letterSpacing: '0.02em',
              width: '100%',
            }}
          >
            🚀 Start Test
          </button>
        </div>
      </div>
    );
  }

  // ── Active test ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button onClick={onHome} style={backBtnStyle}>← Home</button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <span style={{ background: '#fef3c7', color: '#d97706', border: '2px solid #fcd34d', borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.85rem', fontWeight: 700 }}>
            🏆 Test
          </span>
          <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.85rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            ⏱ {formatTime(totalElapsed)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>
          <span>Word {index + 1} of {wordCount}</span>
          <span>{Math.round((index / wordCount) * 100)}% done</span>
        </div>
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(index / wordCount) * 100}%`, background: '#6366f1', borderRadius: '99px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Word {index + 1}
        </h2>

        <CountdownTimer seconds={seconds} total={TIMER_TOTAL} started={timerStarted} />

        <WordPlayer
          word={words[index]}
          speak={speak}
          speakSentenceWithAccent={speakSentenceWithAccent}
          isSpeaking={isSpeaking}
          hasPlayed={hasAutoPlayed}
        />

        <AnswerInput
          value={input}
          onChange={setInput}
          onSubmit={() => doSubmit(false)}
          disabled={submitted || !hasAutoPlayed}
          maxLetters={MAX_LETTERS[difficulty]}
        />
      </div>
    </div>
  );
}

function Chip({ label, colour }: { label: string; colour: string }) {
  return (
    <span style={{
      background: colour + '22',
      color: colour,
      border: `2px solid ${colour}`,
      borderRadius: '8px',
      padding: '0.3rem 0.9rem',
      fontSize: '0.9rem',
      fontWeight: 700,
      textTransform: 'capitalize',
    }}>{label}</span>
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
