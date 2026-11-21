import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await sql.unsafe(schema);
console.log('Schema applied.');
await sql.end();
