// Additive, namespaced migration: the previous copilot tables and their data are untouched.
export const FIXED_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS fixed_batches (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL UNIQUE,
  request_fingerprint TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('immediate', 'scheduled')),
  timezone TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL CHECK (end_at > start_at),
  requested_count INTEGER NOT NULL CHECK (requested_count > 0),
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'completed', 'attention', 'cancelled')),
  dataset_name TEXT NOT NULL,
  dataset_digest TEXT NOT NULL,
  synthetic BOOLEAN NOT NULL DEFAULT true CHECK (synthetic = true),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fixed_jobs (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES fixed_batches(id),
  row_id TEXT NOT NULL,
  row_json JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'submitting', 'succeeded', 'failed', 'uncertain', 'cancelled', 'expired')),
  detail TEXT NOT NULL DEFAULT '',
  worker_id UUID,
  UNIQUE(batch_id, row_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS fixed_jobs_reserved_row_idx ON fixed_jobs(row_id)
  WHERE status IN ('pending', 'running', 'submitting', 'succeeded', 'uncertain');
CREATE UNIQUE INDEX IF NOT EXISTS fixed_jobs_one_active_worker_idx ON fixed_jobs((true))
  WHERE status IN ('running', 'submitting');
CREATE INDEX IF NOT EXISTS fixed_jobs_due_idx ON fixed_jobs(scheduled_at, id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS fixed_jobs_batch_idx ON fixed_jobs(batch_id);
`;
