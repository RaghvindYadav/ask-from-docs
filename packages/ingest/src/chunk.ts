export type Chunk = { heading: string; content: string };

/** ~750 tokens. Big enough for a full concept, small enough to retrieve precisely. */
export const MAX_CHARS = 3000;
/** Skip fragments too small to answer anything on their own. */
const MIN_CHARS = 50;

/**
 * Split a markdown/MDX page into chunks along its ## and ### headings.
 * - Each chunk carries its heading path ("Page > Section > Subsection"), which helps retrieval and citations.
 * - Headings inside fenced code blocks are ignored.
 * - Oversized sections are split on blank lines, never inside a code block.
 */
export function chunkMarkdown(md: string, pageTitle: string): Chunk[] {
  const chunks: Chunk[] = [];
  const path: string[] = [pageTitle];
  let buf: string[] = [];
  let inCode = false;

  const flush = () => {
    const text = buf.join('\n').trim();
    if (text.length >= MIN_CHARS) chunks.push(...splitLong(path.join(' > '), text));
    buf = [];
  };

  for (const line of md.split('\n')) {
    if (line.trim().startsWith('```')) inCode = !inCode;
    const h = !inCode ? /^(#{2,3})\s+(.*)/.exec(line) : null;
    if (h) {
      flush();
      const level = h[1].length; // ## = 2, ### = 3
      path.length = level - 1;   // keep the page title (+ the ## parent for ###)
      path.push(h[2].trim());
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}

function splitLong(heading: string, text: string): Chunk[] {
  if (text.length <= MAX_CHARS) return [{ heading, content: text }];
  const parts: Chunk[] = [];
  let cur = '';
  let inCode = false;
  for (const para of text.split(/\n\n/)) {
    if (!inCode && cur && cur.length + para.length > MAX_CHARS) {
      parts.push({ heading, content: cur.trim() });
      cur = '';
    }
    cur += para + '\n\n';
    const fences = (para.match(/```/g) ?? []).length;
    if (fences % 2 === 1) inCode = !inCode;
  }
  if (cur.trim()) parts.push({ heading, content: cur.trim() });
  return parts;
}

/** Remove MDX noise that hurts embeddings: frontmatter, imports/exports, JSX-only lines. */
export function cleanMdx(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\s*/, '')
    .split('\n')
    .filter(l => !/^(import|export)\s/.test(l))
    .join('\n');
}

export function frontmatterTitle(raw: string): string | undefined {
  const fm = /^---([\s\S]*?)---/.exec(raw)?.[1];
  return fm ? /^title:\s*['"]?(.*?)['"]?\s*$/m.exec(fm)?.[1] : undefined;
}
