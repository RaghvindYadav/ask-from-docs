import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkMarkdown, cleanMdx, frontmatterTitle, MAX_CHARS } from './chunk.ts';

const filler = 'Some explanatory text about the feature that is long enough to keep. ';

test('splits on ## and ### and builds the heading path', () => {
  const md = `Intro ${filler}\n\n## Routing\n\n${filler}\n\n### Dynamic Routes\n\n${filler}\n\n## Caching\n\n${filler}`;
  const headings = chunkMarkdown(md, 'App Router').map(c => c.heading);
  assert.deepEqual(headings, [
    'App Router',
    'App Router > Routing',
    'App Router > Routing > Dynamic Routes',
    'App Router > Caching',
  ]);
});

test('ignores headings inside code blocks', () => {
  const md = `## Example\n\n${filler}\n\n\`\`\`md\n## not a heading\n\`\`\`\n\n${filler}`;
  const chunks = chunkMarkdown(md, 'Page');
  assert.equal(chunks.length, 1);
  assert.match(chunks[0].content, /## not a heading/);
});

test('splits long sections without breaking code blocks', () => {
  const code = '```ts\n' + 'const x = 1;\n\n'.repeat(50) + '```';
  const md = `## Big\n\n${filler.repeat(40)}\n\n${code}\n\n${filler.repeat(40)}`;
  const chunks = chunkMarkdown(md, 'Page');
  assert.ok(chunks.length > 1);
  for (const c of chunks) {
    assert.equal((c.content.match(/```/g) ?? []).length % 2, 0, 'code fence left open');
    assert.ok(c.content.length <= MAX_CHARS * 1.5 || c.content.includes('```'));
  }
});

test('cleans frontmatter and imports, reads title', () => {
  const raw = `---\ntitle: 'Installation'\ndescription: x\n---\nimport { A } from 'b'\n\n# Hello`;
  assert.equal(frontmatterTitle(raw), 'Installation');
  assert.equal(cleanMdx(raw).trim(), '# Hello');
});
