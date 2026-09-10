// Additive, namespaced migration: the previous copilot tables and their data are untouched.
export const FIXED_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS fixed_batches (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL UNIQUE,
  request_fingerprint TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('immediate', 'scheduled')),
  selection TEXT NOT NULL DEFAULT 'mixed' CHECK (selection IN ('mixed', 'completing', 'screened_out')),
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
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'submitting', 'succeeded', 'screened_out', 'failed', 'uncertain', 'cancelled', 'expired')),
  detail TEXT NOT NULL DEFAULT '',
  terminal_page_id BIGINT,
  terminal_page_title TEXT,
  close_reason TEXT,
  retry_of_job_id UUID REFERENCES fixed_jobs(id),
  worker_id UUID,
  UNIQUE(batch_id, row_id)
);
ALTER TABLE fixed_jobs ADD COLUMN IF NOT EXISTS terminal_page_id BIGINT;
ALTER TABLE fixed_jobs ADD COLUMN IF NOT EXISTS terminal_page_title TEXT;
ALTER TABLE fixed_jobs ADD COLUMN IF NOT EXISTS close_reason TEXT;
ALTER TABLE fixed_jobs ADD COLUMN IF NOT EXISTS retry_of_job_id UUID REFERENCES fixed_jobs(id);
ALTER TABLE fixed_batches ADD COLUMN IF NOT EXISTS selection TEXT NOT NULL DEFAULT 'mixed';
ALTER TABLE fixed_batches DROP CONSTRAINT IF EXISTS fixed_batches_selection_check;
ALTER TABLE fixed_batches ADD CONSTRAINT fixed_batches_selection_check CHECK (selection IN ('mixed', 'completing', 'screened_out'));
ALTER TABLE fixed_jobs DROP CONSTRAINT IF EXISTS fixed_jobs_status_check;
ALTER TABLE fixed_jobs ADD CONSTRAINT fixed_jobs_status_check CHECK (status IN ('pending', 'running', 'submitting', 'succeeded', 'screened_out', 'failed', 'uncertain', 'cancelled', 'expired'));
DROP INDEX IF EXISTS fixed_jobs_reserved_row_idx;
CREATE UNIQUE INDEX fixed_jobs_reserved_row_idx ON fixed_jobs(row_id)
  WHERE status IN ('pending', 'running', 'submitting', 'succeeded', 'screened_out', 'uncertain');
CREATE UNIQUE INDEX IF NOT EXISTS fixed_jobs_one_active_worker_idx ON fixed_jobs((true))
  WHERE status IN ('running', 'submitting');
CREATE INDEX IF NOT EXISTS fixed_jobs_due_idx ON fixed_jobs(scheduled_at, id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS fixed_jobs_batch_idx ON fixed_jobs(batch_id);

CREATE TABLE IF NOT EXISTS fixed_remote_responses (
  source_key TEXT NOT NULL,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  submitted_at_text TEXT NOT NULL,
  response_json JSONB NOT NULL,
  row_digest TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (source_key, row_number)
);
CREATE TABLE IF NOT EXISTS fixed_response_sync_state (
  source_key TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('never', 'ok', 'error')),
  source_count INTEGER NOT NULL DEFAULT 0 CHECK (source_count >= 0),
  column_count INTEGER NOT NULL DEFAULT 0 CHECK (column_count >= 0),
  source_digest TEXT,
  header_json JSONB,
  last_attempt_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT
);
`;
