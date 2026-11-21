import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import postgres from 'postgres';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chunkMarkdown, cleanMdx, frontmatterTitle } from './chunk.ts';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const sql = postgres(process.env.DATABASE_URL!);
const model = openai.embedding('text-embedding-3-small');
const BATCH = 100;

// Where each version's docs are published. Check a few generated URLs in the browser and adjust if needed.
const VERSIONS = [
  { version: 'v14', dir: 'data/nextjs-v14', urlBase: 'https://nextjs.org/docs/14' },
  { version: 'v15', dir: 'data/nextjs-v15', urlBase: 'https://nextjs.org/docs/15' },
];

/** docs/01-app/01-getting-started/01-installation.mdx -> <base>/app/getting-started/installation */
function toUrl(relPath: string, urlBase: string): string {
  const slug = relPath
    .replace(/^docs\//, '')
    .replace(/(^|\/)\d{2}-/g, '$1')
    .replace(/(\/index)?\.mdx$/, '');
  return `${urlBase}/${slug}`;
}

async function ingest({ version, dir, urlBase }: (typeof VERSIONS)[number]) {
  const base = path.join(ROOT, dir);
  const files = await glob('docs/**/*.mdx', { cwd: base });
  if (!files.length) throw new Error(`No docs in ${base}. Run "npm run docs:fetch" first.`);

  await sql`DELETE FROM chunks WHERE version = ${version} AND source = 'docs'`; // re-runnable
  let total = 0;

  for (const rel of files) {
    const raw = await readFile(path.join(base, rel), 'utf8');
    const chunks = chunkMarkdown(cleanMdx(raw), frontmatterTitle(raw) ?? path.basename(rel, '.mdx'));
    const url = toUrl(rel, urlBase);

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      // Embedding the heading path with the text helps short questions find the right section
      const { embeddings } = await embedMany({ model, values: batch.map(c => `${c.heading}\n\n${c.content}`) });
      await sql`INSERT INTO chunks ${sql(batch.map((c, j) => ({
        source: 'docs',
        version,
        url,
        heading: c.heading,
        content: c.content,
        tokens: Math.ceil(c.content.length / 4), // rough estimate; fine for stats
        embedding: JSON.stringify(embeddings[j]),
      })))}`;
    }
    total += chunks.length;
    console.log(`${version}  ${String(chunks.length).padStart(3)} chunks  ${rel}`);
  }
  console.log(`\n${version}: ${total} chunks from ${files.length} files\n`);
}

for (const v of VERSIONS) await ingest(v);
await sql.end();
