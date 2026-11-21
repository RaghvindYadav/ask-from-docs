import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import type { EmbeddingModel } from 'ai';

/**
 * One place to choose the embedding provider. Set EMBEDDING_PROVIDER in .env.
 *
 * Both providers return 1536-dim vectors, so db/schema.sql (vector(1536)) works with either.
 * Gemini's model is trained with Matryoshka learning: its first 1536 of 3072 dims are a valid
 * smaller embedding. Cosine distance (our index uses it) doesn't need the vectors normalised.
 *
 * Never mix providers in one table: vectors from different models aren't comparable.
 * Switching provider = re-run `npm run ingest` (it clears the old rows).
 */
export const EMBEDDING_DIMS = 1536;

export type Provider = 'google' | 'openai';
export const provider: Provider = (process.env.EMBEDDING_PROVIDER as Provider) ?? 'google';

/**
 * Gemini embeds documents and queries differently (asymmetric retrieval).
 * Ingest uses 'document'; the search side (week 2) must use 'query'.
 */
export function embeddingModel(kind: 'document' | 'query'): EmbeddingModel<string> {
  if (provider === 'openai') return openai.embedding('text-embedding-3-small');
  return google.textEmbeddingModel('gemini-embedding-001', {
    outputDimensionality: EMBEDDING_DIMS,
    taskType: kind === 'document' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY',
  });
}

/** Chunks per API call. Gemini's free tier allows ~30k tokens/minute, so keep its batches small. */
export const BATCH_SIZE = provider === 'google' ? 20 : 100;

/**
 * Simple tokens-per-minute throttle. EMBED_TPM=0 disables it.
 * Default: 28k for Gemini (free tier limit is 30k), off for OpenAI.
 */
const TPM = Number(process.env.EMBED_TPM ?? (provider === 'google' ? 28000 : 0));
let windowStart = Date.now();
let windowTokens = 0;

export async function throttle(tokens: number) {
  if (!TPM) return;
  if (Date.now() - windowStart >= 60_000) {
    windowStart = Date.now();
    windowTokens = 0;
  }
  if (windowTokens + tokens > TPM) {
    const wait = 60_000 - (Date.now() - windowStart) + 500;
    process.stdout.write(`  …rate limit pause ${Math.ceil(wait / 1000)}s\n`);
    await new Promise(r => setTimeout(r, wait));
    windowStart = Date.now();
    windowTokens = 0;
  }
  windowTokens += tokens;
}
