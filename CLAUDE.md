# CLAUDE.md

Context for Claude (Claude Code / Claude in VS Code) working in this repo.

## Project
Ask the Docs: a version-aware RAG assistant over the Next.js docs (v14 + v15), later also GitHub issues.
It's a portfolio project. The goal is to **learn advanced RAG** and **show measured improvements**,
so explain the reasoning behind changes and don't just hand over code.

## Owner
Full-stack developer (Node.js, React, TypeScript, Dart/Flutter), 3.5 years of experience, has used basic RAG at work.
Learning: hybrid search, re-ranking, query rewriting, evals, tracing, agents.

## How to help
- Teach while building: when adding a new concept (RRF, re-ranking, Recall@k…), explain it in 2–4 sentences first.
- Small, reviewable steps. One feature per change, and run it before moving on.
- Every retrieval or prompt change must be measured: run `npm run eval` before and after, and update the Results table in README.md.
- Never invent eval numbers. Leave a cell as `–` until it's measured.
- Don't commit secrets. Keys live in `.env` (gitignored); `.env.example` lists the names only.

## Stack and conventions
- TypeScript everywhere, ESM (`"type": "module"`), run scripts with `tsx`.
- npm workspaces: `apps/*`, `packages/*`.
- Postgres 16 + pgvector via `docker compose`; SQL with the `postgres` package (may move to Drizzle later).
- LLM and embeddings via Vercel AI SDK (`ai`, `@ai-sdk/openai`). Embedding model: `text-embedding-3-small` (1536 dims).
- Chunks table: see `db/schema.sql` (source, version, url, heading, content, tokens, embedding, tsv).

## Commands
- `docker compose up -d`: start Postgres
- `npm run db:init`: create the extension, tables and indexes
- `npm run docs:fetch`: clone Next.js docs for v14 and v15 into `data/` (gitignored)
- `npm run ingest`: chunk + embed + store
- `npm run db:stats`: chunk counts per version
- `npm run eval`: run the eval set (week 2+)

## Current phase
Week 1: ingestion. See the Roadmap in README.md for what's next.
