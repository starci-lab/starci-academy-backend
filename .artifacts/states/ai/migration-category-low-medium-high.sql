-- Migrate the ai_model_category Postgres enum from the old five-value scheme
-- (free/economy/balanced/premium/frontier) to the three capability tiers
-- (low/medium/high), preserving existing rows.
--
-- WHY BY HAND, not synchronize: TypeORM's synchronize cannot RENAME an enum
-- value; it would drop+recreate the type and the cast of an existing 'free' row
-- to the new type would fail. This is the enum-under-synchronize hazard that has
-- bitten this project before, so the value migration is explicit.
--
-- RUN THIS BEFORE deploying the code that changes the AiModelCategory enum, so
-- that when the new code boots the DB type already matches the entity and
-- synchronize is a no-op.
--
-- Fold: free,economy -> low ; balanced -> medium ; premium,frontier -> high.
-- Embedding models keep their own tier: any row whose supportedTasks include
-- 'embedding' becomes 'embedding', overriding the fold above — embedding is a
-- separate axis (vectorizing the source for RAG), not a rung.
-- Idempotent-ish: safe to re-run only if it has NOT yet completed (guarded by
-- the type name swap at the end).

BEGIN;

-- 1. the target type — three capability rungs plus two embedding axes
--    (bulk = self-hosted corpus indexing, doc = cloud per-request)
CREATE TYPE ai_model_category_new AS ENUM (
    'low', 'medium', 'high', 'embedding_bulk', 'embedding_doc'
);

-- 2. re-type the column, mapping every old value to its tier in one pass;
--    embedding models are re-homed in step 3
ALTER TABLE ai_models
    ALTER COLUMN category TYPE ai_model_category_new
    USING (
        CASE category::text
            WHEN 'free'      THEN 'low'
            WHEN 'economy'   THEN 'low'
            WHEN 'balanced'  THEN 'medium'
            WHEN 'premium'   THEN 'high'
            WHEN 'frontier'  THEN 'high'
            ELSE 'low'
        END::ai_model_category_new
    );

-- 3. embedding models get an embedding axis, identified by their task tag
--    rather than the old category. Self-hosted (provider 'local') is the bulk
--    corpus-indexing model; any other embedding model is a cloud doc embedder.
UPDATE ai_models
    SET category = CASE
        WHEN provider = 'local' THEN 'embedding_bulk'::ai_model_category_new
        ELSE 'embedding_doc'::ai_model_category_new
    END
    WHERE 'embedding' = ANY (
        SELECT jsonb_array_elements_text(supported_tasks)
    );

-- 4. drop the old type and take its name, so the entity's enumName still resolves
DROP TYPE ai_model_category;
ALTER TYPE ai_model_category_new RENAME TO ai_model_category;

COMMIT;
