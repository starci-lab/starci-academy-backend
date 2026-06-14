-- Enroll tuanhuu3264@gmail.com into EVERY existing course.
-- Idempotent: re-running inserts nothing for courses already enrolled
-- (unique constraint UQ_enrollments_user_course on (user_id, course_id)).
--
-- Run against the PRODUCTION app database, e.g.:
--   psql "postgres://USER:PASS@HOST:5432/DB" -f scratch/enroll-tuanhuu-all-courses.sql
--
-- id / created_at / updated_at / task_plan_status are filled by DB defaults;
-- pricing_phase is required (enum pioneer|earlyBird|regular) → set to 'regular'.

\set email 'tuanhuu3264@gmail.com'

-- 1) Preview: the user must exist (enrollment FK → users), and show counts.
SELECT (SELECT id      FROM users   WHERE email = :'email')                              AS user_id,
       (SELECT count(*) FROM courses)                                                    AS total_courses,
       (SELECT count(*) FROM enrollments e
          JOIN users u ON u.id = e.user_id
         WHERE u.email = :'email')                                                       AS already_enrolled;

-- 2) Enroll into every course not already enrolled.
INSERT INTO enrollments (user_id, course_id, pricing_phase)
SELECT u.id, c.id, 'regular'
FROM users u
CROSS JOIN courses c
WHERE u.email = :'email'
ON CONFLICT ON CONSTRAINT "UQ_enrollments_user_course" DO NOTHING;

-- 3) Verify the resulting enrollments.
SELECT c.title, c.slug, e.pricing_phase, e.task_plan_status, e.created_at
FROM enrollments e
JOIN users u  ON u.id = e.user_id
JOIN courses c ON c.id = e.course_id
WHERE u.email = :'email'
ORDER BY c.order_index;
