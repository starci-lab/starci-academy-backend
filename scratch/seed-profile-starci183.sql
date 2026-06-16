-- Seed verified activity for user starci183 (d126bd2d-179c-42cd-9efb-9e4974a20c98)
-- so the public profile Coding / Skills / Projects (capstone + solved challenges)
-- tabs render real data. All inserts are idempotent (NOT EXISTS guards) so it is
-- safe to re-run. The CQRS projections recompute lazily on next read.
BEGIN;

\set uid '\'d126bd2d-179c-42cd-9efb-9e4974a20c98\''

-- ---------------------------------------------------------------------------
-- 1) Coding submissions (accepted) — drives userCodingHistory + userCodingSkills.
--    Spread across languages (ts/python/js/java/cpp) + difficulty (medium/hard).
-- ---------------------------------------------------------------------------
INSERT INTO coding_submissions
    (id, created_at, updated_at, user_id, coding_problem_id, language, source_code,
     verdict, passed_count, total_count, runtime_ms, memory_kb, suspicion_score, flagged_for_review)
SELECT gen_random_uuid(), now() - v.ago, now() - v.ago, :uid::uuid, v.pid::uuid, v.lang::coding_language,
       '// solved on StarCi Academy', 'accepted'::coding_verdict, 12, 12, 84, 13240, 0, false
FROM (VALUES
    ('e4298c53-aef3-5cf4-babf-3a1414721b06','typescript', interval '7 days'),
    ('bb4144ed-a240-5552-8f1e-434c36dfd0d2','python',     interval '6 days'),
    ('c1c883b7-0fff-5791-9692-831d67051b13','javascript', interval '5 days'),
    ('0b2ff27a-5ae9-5d28-b730-ac66ff665d97','java',       interval '4 days'),
    ('822969b6-abcf-54bb-bc2a-7009f53c601a','cpp',        interval '3 days'),
    ('64dc57cd-4a24-5ce4-8bf1-3a45616593ea','typescript', interval '2 days'),
    ('dc19dbb7-3608-588a-a369-71d40cbe9db2','python',     interval '1 day'),
    ('1f85790b-5dfa-505f-ad25-a694c9520988','java',       interval '12 hours')
) AS v(pid, lang, ago)
WHERE NOT EXISTS (
    SELECT 1 FROM coding_submissions cs
    WHERE cs.user_id = :uid::uuid AND cs.coding_problem_id = v.pid::uuid AND cs.verdict = 'accepted'
);

-- ---------------------------------------------------------------------------
-- 2) Solved challenges (passed) — drives userSolvedChallenges (Projects tab).
--    Each carries a git submission link + the language the dev chose (4-lang flex).
-- ---------------------------------------------------------------------------
WITH picked AS (
    SELECT * FROM (VALUES
        ('63c379b6-531f-55bf-95bd-9d1dcb675768'::uuid, 'https://github.com/starci183/starci-shop-graphql-api',      'typescript', interval '9 days'),
        ('85863a23-7a70-5576-96bb-4d5cffa6c752'::uuid, 'https://github.com/starci183/starci-shop-click-ingest',     'go',         interval '6 days'),
        ('9fc634e8-a9aa-5227-9165-7401a71ba655'::uuid, 'https://github.com/starci183/starci-shop-dataloader',       'java',       interval '4 days'),
        ('0c4abdd3-ee8a-5e7f-8e92-a6d191aec715'::uuid, 'https://github.com/starci183/starci-shop-complexity-guard', 'csharp',     interval '2 days')
    ) AS p(submission_id, url, lang, ago)
),
ins_ucs AS (
    INSERT INTO user_challenge_submissions
        (id, created_at, updated_at, user_id, submission_id, submission_url, selected_lang, selected_mode)
    SELECT gen_random_uuid(), now() - p.ago, now() - p.ago, :uid::uuid, p.submission_id, p.url, p.lang,
           'auto'::ai_mode
    FROM picked p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_challenge_submissions ucs
        WHERE ucs.user_id = :uid::uuid AND ucs.submission_id = p.submission_id
    )
    RETURNING id, submission_url, created_at
)
INSERT INTO user_challenge_submission_attempts
    (id, created_at, updated_at, attempt_number, score, short_feedback, processed_at,
     submission_url, default_locale, user_challenge_submission_id)
SELECT gen_random_uuid(), i.created_at, i.created_at, 1, 100, 'Passed all criteria.', i.created_at,
       i.submission_url, 'vi'::locale, i.id
FROM ins_ucs i;

-- ---------------------------------------------------------------------------
-- 3) Passed capstone tasks — drives userCapstoneTasks (Projects tab).
--    FS enrollment 3086c804 / SD enrollment 8e926d2f.
-- ---------------------------------------------------------------------------
WITH picked AS (
    SELECT * FROM (VALUES
        ('3086c804-579f-442d-8c41-254c8991e4bb'::uuid, '2ff64ecb-68f9-5a96-bea4-704c7518aca3'::uuid, 1, 100, interval '20 days'),
        ('3086c804-579f-442d-8c41-254c8991e4bb'::uuid, '74b79b55-32b2-57fb-a5d3-57bfe5daf673'::uuid, 2,  95, interval '17 days'),
        ('3086c804-579f-442d-8c41-254c8991e4bb'::uuid, '5db54317-6489-512a-951f-ce8c6b8bb0c2'::uuid, 3, 100, interval '14 days'),
        ('3086c804-579f-442d-8c41-254c8991e4bb'::uuid, 'b4844d5c-6071-5055-9eca-97484e403a5c'::uuid, 4,  90, interval '11 days'),
        ('8e926d2f-5f7e-4398-95bb-d5b14e805779'::uuid, '388ea18a-1349-5015-8d05-3f7ee85d6610'::uuid, 1, 100, interval '8 days'),
        ('8e926d2f-5f7e-4398-95bb-d5b14e805779'::uuid, '1357dcc4-41f4-5903-831a-7ddda3825a45'::uuid, 2,  92, interval '5 days')
    ) AS p(enrollment_id, milestone_task_id, ord, score, ago)
),
ins_umt AS (
    INSERT INTO user_milestone_tasks
        (id, created_at, updated_at, order_index, sort_index, enrollment_id, milestone_task_id)
    SELECT gen_random_uuid(), now() - p.ago, now() - p.ago, p.ord, p.ord, p.enrollment_id, p.milestone_task_id
    FROM picked p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_milestone_tasks umt
        WHERE umt.enrollment_id = p.enrollment_id AND umt.milestone_task_id = p.milestone_task_id
    )
    RETURNING id, milestone_task_id, created_at
)
INSERT INTO user_milestone_task_attempts
    (id, created_at, updated_at, attempt_number, passed, score, short_feedback, processed_at,
     default_locale, user_milestone_task_id)
SELECT gen_random_uuid(), i.created_at, i.created_at, 1, true, p.score, 'Capstone task verified.', i.created_at,
       'vi'::locale, i.id
FROM ins_umt i
JOIN picked p ON p.milestone_task_id = i.milestone_task_id;

COMMIT;
