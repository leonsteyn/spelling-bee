import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeech() {
  const [voicesReady, setVoicesReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      // Prefer high-quality (neural/enhanced) Australian voices first, then any AU, then any English.
      // On macOS: Samantha (en-US, very natural), Karen (en-AU), Lee (en-AU).
      // "Neural" and "Enhanced" in the name indicate higher-quality synthesis on macOS/iOS/Windows.
      const isNatural = (v: SpeechSynthesisVoice) =>
        /neural|enhanced|premium|natural/i.test(v.name);

      const naturalAU = voices.find(v => v.lang === 'en-AU' && isNatural(v));
      const AU_NAMES = ['Karen', 'Lee', 'Catherine', 'James'];
      const namedAU = voices.find(
        v => v.lang === 'en-AU' && AU_NAMES.some(n => v.name.includes(n))
      );
      const anyAU = voices.find(v => v.lang === 'en-AU');
      const naturalEN = voices.find(v => v.lang.startsWith('en') && isNatural(v));
      const anyEN = voices.find(v => v.lang.startsWith('en'));
      selectedVoiceRef.current =
        naturalAU ?? namedAU ?? anyAU ?? naturalEN ?? anyEN ?? voices[0];
      setVoicesReady(true);
    }

    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, []);

  function makeUtterance(text: string, rate: number, pitch: number): SpeechSynthesisUtterance {
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoiceRef.current) u.voice = selectedVoiceRef.current;
    u.rate = rate;
    u.pitch = pitch;
    return u;
  }

  /** Strip punctuation that TTS engines sometimes read aloud (e.g. "full stop"). */
  function cleanText(text: string): string {
    return text.replace(/[.!?;,]+$/g, '').trim();
  }

  /** Speak a single word or phrase at normal speed. */
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = makeUtterance(cleanText(text), 0.85, 1);
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Read a sentence aloud, accentuating the target word by slowing it down
   * and raising its pitch. Splits the sentence on the first match of the word
   * (case-insensitive, whole-word boundary) and chains three utterances:
   *   [before]  normal rate/pitch
   *   [word]    slow rate, higher pitch
   *   [after]   normal rate/pitch
   */
  const speakSentenceWithAccent = useCallback((sentence: string, word: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Strip trailing punctuation so TTS doesn't say "full stop" etc.
    const cleaned = cleanText(sentence);

    // Split at first whole-word occurrence, keeping the matched word as a part
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\b${escaped}\\b)`, 'i');
    const parts = cleaned.split(regex);
    // parts example for "The cat sat" / "cat": ["The ", "cat", " sat"]

    const utterances: SpeechSynthesisUtterance[] = [];
    for (const part of parts) {
      if (!part) continue;
      const isAccented = regex.test(part);
      // Dial down accentuation: slightly slower + slightly higher pitch (was 0.6/1.4)
      utterances.push(makeUtterance(part, isAccented ? 0.72 : 0.85, isAccented ? 1.15 : 1.0));
    }

    if (utterances.length === 0) return;

    // Chain: each utterance's onend triggers the next
    for (let i = 0; i < utterances.length - 1; i++) {
      const next = utterances[i + 1];
      utterances[i].onend = () => window.speechSynthesis.speak(next);
    }
    utterances[0].onstart = () => setIsSpeaking(true);
    utterances[utterances.length - 1].onend = () => setIsSpeaking(false);
    utterances.forEach(u => { u.onerror = () => setIsSpeaking(false); });

    window.speechSynthesis.speak(utterances[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { voicesReady, isSpeaking, speak, speakSentenceWithAccent };
}
