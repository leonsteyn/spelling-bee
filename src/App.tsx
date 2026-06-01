import { useState } from 'react';
import type { Difficulty } from './data/wordLists';
import HomeScreen from './components/HomeScreen';
import PracticeMode from './components/PracticeMode';
import TestMode from './components/TestMode';

type Screen =
  | { name: 'home' }
  | { name: 'practice'; difficulty: Difficulty }
  | { name: 'test'; difficulty: Difficulty; wordCount: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  function handleStart(mode: 'practice' | 'test', difficulty: Difficulty, wordCount?: number) {
    if (mode === 'practice') {
      setScreen({ name: 'practice', difficulty });
    } else {
      setScreen({ name: 'test', difficulty, wordCount: wordCount ?? 10 });
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #d1fae5 100%)',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: '1rem',
    }}>
      {screen.name === 'home' && (
        <HomeScreen onStart={handleStart} />
      )}
      {screen.name === 'practice' && (
        <PracticeMode
          difficulty={screen.difficulty}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'test' && (
        <TestMode
          difficulty={screen.difficulty}
          wordCount={screen.wordCount}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  );
}
