/**
 * generateWordData.ts
 *
 * Calls Claude to produce difficulty-appropriate definitions and example
 * sentences for every word in the spelling-bee word lists, then writes the
 * results to src/data/wordData.ts.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generateWordData.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generateWordData.ts --sample   (5 words/level)
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generateWordData.ts --level beginner
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { wordLists } from '../src/data/wordLists';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCH_SIZE = 20; // words per API call

const PROMPTS: Record<string, string> = {
  beginner: `You are writing content for a spelling bee app for Australian primary school children aged 5–8.
For each word, provide:
- "definition": A simple explanation a young child can understand. Use short everyday words. Max 12 words. Never use the target word or any form of it.
- "example": A short sentence using the word naturally. Max 8 words. Must contain the exact target word.

Respond ONLY with a JSON object mapping each word to { "definition": "...", "example": "..." }.
No markdown, no explanation, just the raw JSON.`,

  intermediate: `You are writing content for a spelling bee app for Australian primary school children aged 9–11.
For each word, provide:
- "definition": A clear explanation with slightly richer vocabulary. Max 18 words. Never use the target word or any form of it.
- "example": A natural sentence that helps students understand the word's meaning. Max 12 words. Must contain the exact target word.

Respond ONLY with a JSON object mapping each word to { "definition": "...", "example": "..." }.
No markdown, no explanation, just the raw JSON.`,

  advanced: `You are writing content for a spelling bee app for Australian primary school children aged 12–13.
For each word, provide:
- "definition": An accurate, complete definition appropriate for an older student. Never use the target word or any form of it.
- "example": A natural, illustrative sentence. Must contain the exact target word.

Respond ONLY with a JSON object mapping each word to { "definition": "...", "example": "..." }.
No markdown, no explanation, just the raw JSON.`,
};

async function generateBatch(
  words: string[],
  difficulty: string
): Promise<Record<string, { definition: string; example: string }>> {
  const wordList = words.map(w => `"${w}"`).join(', ');
  const prompt = `${PROMPTS[difficulty]}\n\nWords: ${wordList}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  // Strip any accidental markdown fences
  const json = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

async function main() {
  const args = process.argv.slice(2);
  const sampleMode = args.includes('--sample');
  const levelFilter = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;

  const levels = (levelFilter ? [levelFilter] : ['beginner', 'intermediate', 'advanced']) as (keyof typeof wordLists)[];

  // Load any existing data so we can merge/extend without losing previous work
  const outPath = path.join(__dirname, '../src/data/wordData.ts');
  let existing: Record<string, { definition: string; example: string }> = {};
  if (fs.existsSync(outPath)) {
    const raw = fs.readFileSync(outPath, 'utf8');
    const match = raw.match(/export const wordData[^=]*=\s*(\{[\s\S]*\});/);
    if (match) {
      // eslint-disable-next-line no-eval
      existing = eval(`(${match[1]})`);
    }
  }

  const result: Record<string, { definition: string; example: string }> = { ...existing };

  for (const level of levels) {
    const allWords = wordLists[level];
    const words = sampleMode ? allWords.slice(0, 5) : allWords;
    // Skip words we already have data for
    const toGenerate = words.filter(w => !result[w]);
    console.log(`[${level}] ${toGenerate.length} words to generate (${sampleMode ? 'sample mode' : 'full mode'})`);

    for (let i = 0; i < toGenerate.length; i += BATCH_SIZE) {
      const batch = toGenerate.slice(i, i + BATCH_SIZE);
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(', ')}`);
      try {
        const data = await generateBatch(batch, level);
        Object.assign(result, data);
        console.log(`  ✅ done`);
      } catch (err) {
        console.error(`  ❌ failed:`, err);
      }
      // Polite pause between batches
      if (i + BATCH_SIZE < toGenerate.length) await new Promise(r => setTimeout(r, 500));
    }
  }

  // Write output file
  const entries = Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([word, { definition, example }]) => {
      const defEsc = definition.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const exEsc = example.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `  '${word}': { definition: '${defEsc}', example: '${exEsc}' },`;
    })
    .join('\n');

  const output = `// AUTO-GENERATED by scripts/generateWordData.ts — do not edit by hand.
// Re-run the script to add or update entries.
export const wordData: Record<string, { definition: string; example: string }> = {
${entries}
};
`;

  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`\n✅ Written ${Object.keys(result).length} words to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
