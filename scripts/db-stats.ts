import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const rows = await sql`
  SELECT version, source, count(*)::int AS chunks, avg(tokens)::int AS avg_tokens, max(tokens) AS max_tokens
  FROM chunks GROUP BY version, source ORDER BY version, source`;
console.table(rows);

// Read a few random chunks: the best week-1 habit for spotting bad chunking
const sample = await sql`SELECT version, heading, left(content, 300) AS preview FROM chunks ORDER BY random() LIMIT 3`;
for (const s of sample) console.log(`\n[${s.version}] ${s.heading}\n${s.preview}…`);
await sql.end();
