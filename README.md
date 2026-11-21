# Ask the Docs

**Version-aware RAG assistant for the Next.js documentation, with cited answers and measured accuracy.**

Ask a question like *"Is `params` async in v15?"* and get a grounded answer that cites the exact docs pages for the version you're on. If the answer isn't in the docs, it says *"I couldn't find this"* instead of guessing.

> 🚧 Work in progress. See the [roadmap](#roadmap) for current status.
>
> **Live demo:** _coming in week 5_ · **Demo GIF:** _coming in week 5_

---

## Why this project

Most RAG demos stop at "embed a PDF and chat with it". This project focuses on what makes RAG work in production:

- **Hybrid retrieval:** vector search + Postgres full-text (BM25-style), merged with Reciprocal Rank Fusion
- **Re-ranking:** a cross-encoder re-scores the top 30 candidates and keeps the best 5
- **Query rewriting + version filtering:** messy questions become good search queries; answers match the docs version you're on
- **Grounded, cited answers + abstention:** every claim links to a source; low-confidence retrieval means "I don't know"
- **Evaluation-driven:** every change is measured against a fixed 50-question eval set (see [Results](#results))
- **Observability:** every query is traced (chunks, prompt, tokens, latency, cost) in Langfuse
- **Agentic layer:** an agent chooses between docs and GitHub issues and checks that its own answer is cited before replying

## Architecture

```
OFFLINE (when the docs change)
  Next.js docs + GitHub issues ─► Clean + chunk (by heading) ─► Embed ─► Postgres
                                                                         ├─ pgvector (HNSW)
                                                                         ├─ full-text index (tsvector)
ONLINE (every question)                                                  └─ metadata: version, url, heading
  Question ─► Rewrite query + detect version ─► Hybrid search ◄──────────┘
                                                     │
                                                     ▼
            Langfuse trace + evals ◄┄┄ Answer (cited or abstain) ◄─ Re-rank (top 30 → 5)
```

## Results

Measured on 50 hand-written questions (`packages/evals/questions.json`): 15 simple lookups, 10 exact API names, 10 version-specific, 8 vague, 7 not in the docs (should abstain).

| System version | Recall@5 | Answer correct | Abstain acc. | Cost / query | p50 latency |
| --- | --- | --- | --- | --- | --- |
| Baseline: vector top-5 | – | – | – | – | – |
| + hybrid (vector + full-text, RRF) | – | – | – | – | – |
| + re-ranker | – | – | – | – | – |
| + query rewriting + version filter | – | – | – | – | – |
| + abstain threshold | – | – | – | – | – |
| Agentic (tools + self-check) | – | – | – | – | – |

**Metrics**
- **Recall@5:** the expected docs page is among the top 5 retrieved chunks
- **Answer correct:** an LLM judge compares the answer to a reference answer (spot-checked by hand)
- **Abstain accuracy:** refuses the out-of-scope questions, answers the rest

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router), Tailwind |
| LLM + embeddings | Vercel AI SDK; Gemini `gemini-embedding-001` (1536 dims) or OpenAI `text-embedding-3-small` |
| Database | Postgres 16 + pgvector (Docker locally, Neon in prod) |
| Re-ranker | Cohere Rerank |
| Tracing | Langfuse |
| Agents | LangGraph.js or Mastra |
| Language | TypeScript throughout |

## Project structure

```
ask-the-docs/
  apps/web/              # Next.js UI + API routes            (week 2)
  packages/ingest/       # fetch → clean → chunk → embed → store (week 1)
  packages/retrieval/    # vector, keyword, hybrid, rerank      (weeks 2–4)
  packages/generation/   # prompts, citations, abstain logic    (weeks 2–4)
  packages/evals/        # question set + runner + report       (week 2+)
  db/schema.sql          # tables + indexes
  docker-compose.yml     # local Postgres with pgvector
```

## Getting started

**Prerequisites:** Node 20+, Docker, a Gemini API key (free from Google AI Studio) or an OpenAI API key.

```bash
# 1. Install
npm install
cp .env.example .env          # add GOOGLE_GENERATIVE_AI_API_KEY (or set EMBEDDING_PROVIDER=openai)

# 2. Start Postgres + create tables
docker compose up -d
npm run db:init

# 3. Download two versions of the Next.js docs
npm run docs:fetch

# 4. Chunk, embed and store (tip: INGEST_LIMIT=20 npm run ingest for a quick test)
npm run ingest

# 5. Inspect the result
npm run db:stats
```

## Roadmap

- [ ] **Week 1:** Ingestion pipeline (heading-aware chunker, embeddings, pgvector)
- [ ] **Week 2:** Basic RAG + streaming chat UI + 50-question eval baseline
- [ ] **Week 3:** Hybrid search (RRF) + re-ranking
- [ ] **Week 4:** Query rewriting, version filter, abstention, Langfuse tracing
- [ ] **Week 5:** GitHub issues as a second source, deploy (Vercel + Neon)
- [ ] **Week 6:** Agentic layer + MCP server, agent vs pipeline comparison

## Lessons learned

_Notes on what worked, what didn't, and why, added as the project progresses._

## License

MIT
