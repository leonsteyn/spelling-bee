import { useState, useEffect } from 'react';
import { wordData } from '../data/wordData';

interface Props {
  word: string;
  speak: (text: string) => void;
  speakSentenceWithAccent: (sentence: string, word: string) => void;
  isSpeaking: boolean;
  onFirstPlay?: () => void;
  hasPlayed: boolean;
}

// Strip common suffixes to get a rough root, e.g. "helpful" → "help"
function getRoot(word: string): string {
  const lower = word.toLowerCase();
  const suffixes = ['ation', 'tion', 'ness', 'ment', 'ful', 'less', 'ing', 'ion', 'ity', 'ive', 'ous', 'ly', 'ed', 'er', 'est', 'es', 's'];
  for (const suffix of suffixes) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      return lower.slice(0, lower.length - suffix.length);
    }
  }
  return lower;
}

function containsWord(text: string, word: string): boolean {
  const lower = word.toLowerCase();
  const root = getRoot(word);
  const wordRe = new RegExp(`\\b${lower}`, 'i');
  const rootRe = new RegExp(`\\b${root}`, 'i');
  return wordRe.test(text) || (root !== lower && rootRe.test(text));
}

type ApiEntry = {
  meanings?: {
    definitions?: { definition?: string; example?: string }[];
  }[];
};

function parseResponse(data: ApiEntry[], word: string): { definition: string; example: string | null } {
  const definitions: string[] = [];
  // Collect all examples that actually contain the word (needed for accentuation)
  const examples: string[] = [];

  for (const entry of data) {
    for (const meaning of entry.meanings ?? []) {
      for (const def of meaning.definitions ?? []) {
        if (def.definition) definitions.push(def.definition);
        if (def.example) {
          const ex = def.example.trim();
          // Only keep examples where the word appears (so we can accentuate it)
          const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp(`\\b${escaped}\\b`, 'i').test(ex)) {
            examples.push(ex);
          }
        }
      }
    }
  }

  // Definition: first one that doesn't reference the word; fall back to first overall
  const definition =
    definitions.find(d => !containsWord(d, word)) ?? definitions[0] ?? 'No definition found.';

  // Example: prefer the shortest one (most digestible for students)
  const example = examples.length > 0
    ? examples.sort((a, b) => a.length - b.length)[0]
    : null;

  return { definition, example };
}

export default function WordPlayer({ word, speak, speakSentenceWithAccent, isSpeaking, onFirstPlay, hasPlayed }: Props) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [loadingDef, setLoadingDef] = useState(false);

  useEffect(() => {
    setDefinition(null);
    setExample(null);

    // Use pre-generated local data when available (instant, no network)
    const local = wordData[word.toLowerCase()];
    if (local) {
      setDefinition(local.definition);
      setExample(local.example);
      return;
    }

    // Fall back to dictionary API for words not yet in wordData.ts
    setLoadingDef(true);
    let cancelled = false;

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const parsed = parseResponse(data as ApiEntry[], word);
        setDefinition(parsed.definition);
        setExample(parsed.example);
      })
      .catch(() => {
        if (!cancelled) {
          setDefinition("We couldn't find a definition for this word right now.");
          setExample(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDef(false);
      });

    return () => { cancelled = true; };
  }, [word]);

  function handlePlay() {
    speak(word);
    if (!hasPlayed && onFirstPlay) onFirstPlay();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
      {/* Play word button */}
      <button
        onClick={handlePlay}
        disabled={isSpeaking}
        style={{
          padding: '0.9rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 700,
          background: isSpeaking ? '#93c5fd' : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          cursor: isSpeaking ? 'wait' : 'pointer',
          minWidth: '200px',
          minHeight: '52px',
          boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
          transition: 'background 0.2s',
          width: '100%',
        }}
      >
        {isSpeaking ? '🔊 Playing…' : hasPlayed ? '🔁 Play Word Again' : '▶️ Play Word'}
      </button>

      {/* Definition box */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.9rem 1.2rem',
        width: '100%',
        fontSize: '1rem',
        color: '#334155',
        lineHeight: 1.6,
        minHeight: '3.2rem',
        display: 'flex',
        alignItems: 'center',
      }}>
        {loadingDef
          ? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading definition…</span>
          : <span><strong>Definition:</strong> {definition}</span>
        }
      </div>

      {/* Use in a sentence button — only shown once the API has responded */}
      {!loadingDef && (
        <button
          onClick={() => example && speakSentenceWithAccent(example, word)}
          disabled={isSpeaking || !example}
          title={example ?? 'No example sentence available for this word'}
          style={{
            padding: '0.7rem 1.4rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: isSpeaking || !example ? '#f1f5f9' : '#fef3c7',
            color: isSpeaking || !example ? '#94a3b8' : '#92400e',
            border: `2px solid ${isSpeaking || !example ? '#e2e8f0' : '#fcd34d'}`,
            borderRadius: '10px',
            cursor: isSpeaking || !example ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            width: '100%',
            transition: 'all 0.15s',
          }}
        >
          💬 Use the word in a sentence
          {!example && !loadingDef && (
            <span style={{ fontSize: '0.8rem', marginLeft: '0.4rem', opacity: 0.7 }}>(no example available)</span>
          )}
        </button>
      )}
    </div>
  );
}
