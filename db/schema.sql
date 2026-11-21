CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
  id          bigserial PRIMARY KEY,
  source      text NOT NULL,          -- 'docs' | 'issue'
  version     text NOT NULL,          -- 'v14' | 'v15'
  url         text NOT NULL,
  heading     text NOT NULL,          -- e.g. 'Routing > Dynamic Routes'
  content     text NOT NULL,
  tokens      int  NOT NULL,
  embedding   vector(1536) NOT NULL,
  tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', heading || ' ' || content)) STORED,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin (tsv);   -- used from week 3 (hybrid search)
CREATE INDEX IF NOT EXISTS chunks_version_idx ON chunks (version);
