\set ON_ERROR_STOP on
\if :{?target_email}
\else
\set target_email 'cuongnvtse160875@gmail.com'
\endif
\if :{?primary_course}
\else
\set primary_course 'fullstack-mastery'
\endif

BEGIN;

CREATE TEMP TABLE starci_seed_input (
    target_email text NOT NULL,
    primary_course text NOT NULL
) ON COMMIT PRESERVE ROWS;

INSERT INTO starci_seed_input VALUES (:'target_email', :'primary_course');

DO $seed$
DECLARE
    target_user_id uuid;
    primary_course_id uuid;
    current_course_id uuid;
    current_enrollment_id uuid;
    demo_user_id uuid;
    demo_enrollment_id uuid;
    challenge_submission_id uuid;
    user_submission_id uuid;
    user_task_id uuid;
    course_slug text;
    course_ratio numeric;
    demo_name text;
    learned_count integer;
    challenge_index integer := 0;
    task_index integer := 0;
    demo_index integer;
    day_index integer;
    course_index integer;
    course_slugs text[] := ARRAY['fullstack-mastery', 'system-design-mastery', 'ai-llm-mastery'];
    course_ratios numeric[] := ARRAY[0.38, 0.17, 0.06];
    demo_names text[] := ARRAY[
        'An Nguyễn', 'Bảo Trần', 'Chi Lê', 'Dũng Phạm',
        'Giang Võ', 'Hà Bùi', 'Khánh Đỗ', 'Linh Hồ',
        'Minh Đào', 'Nhi Vũ', 'Quân Phan', 'Trang Cao'
    ];
BEGIN
    SELECT u.id INTO target_user_id
    FROM users u, starci_seed_input i
    WHERE lower(u.email) = lower(i.target_email)
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target account % must sign in once before this seed runs',
            (SELECT target_email FROM starci_seed_input);
    END IF;

    SELECT c.id INTO primary_course_id
    FROM courses c, starci_seed_input i
    WHERE c.display_id = i.primary_course
    LIMIT 1;

    IF primary_course_id IS NULL THEN
        RAISE EXCEPTION 'Primary course % is missing; run the GitMount catalog reseed first',
            (SELECT primary_course FROM starci_seed_input);
    END IF;

    UPDATE users
    SET display_name = COALESCE(NULLIF(display_name, ''), 'Cường Nguyễn'),
        bio = 'Đang xây nền tảng full-stack vững chắc qua bài học, challenge và dự án thực tế.',
        github_username = COALESCE(github_username, 'cuongnvtse160875'),
        open_to_work = true,
        coin_balance = 185,
        weekly_goal_lessons = 5,
        weekly_kpi_targets = '{"lessons":5,"studyDays":5,"challenges":2,"coding":3,"flashcards":5,"milestones":2}'::jsonb,
        streak_freezes = 1,
        role_title = COALESCE(role_title, 'Full-stack Developer'),
        location = COALESCE(location, 'Ho Chi Minh City, Vietnam'),
        updated_at = now()
    WHERE id = target_user_id;

    INSERT INTO ai_subscriptions (
        user_id, tier, status, current_period_end, auto_renew,
        window_5h_reset_at, window_week_reset_at,
        credit_5h_used, credit_week_used,
        bonus_credit_5h, bonus_credit_week, ceil_overrides
    ) VALUES (
        target_user_id, NULL, 'active', NULL, false,
        now() + interval '5 hours', now() + interval '7 days',
        8, 21, 30, 80, NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        window_5h_reset_at = EXCLUDED.window_5h_reset_at,
        window_week_reset_at = EXCLUDED.window_week_reset_at,
        credit_5h_used = EXCLUDED.credit_5h_used,
        credit_week_used = EXCLUDED.credit_week_used,
        bonus_credit_5h = EXCLUDED.bonus_credit_5h,
        bonus_credit_week = EXCLUDED.bonus_credit_week,
        updated_at = now();

    FOR course_index IN 1..array_length(course_slugs, 1) LOOP
        course_slug := course_slugs[course_index];
        course_ratio := course_ratios[course_index];

        SELECT id INTO current_course_id FROM courses WHERE display_id = course_slug;
        IF current_course_id IS NULL THEN
            CONTINUE;
        END IF;

        INSERT INTO enrollments (user_id, course_id, pricing_phase, is_enrolled)
        VALUES (target_user_id, current_course_id, 'earlyBird', true)
        ON CONFLICT (user_id, course_id) DO UPDATE SET
            is_enrolled = true,
            updated_at = now();

        SELECT id INTO current_enrollment_id
        FROM enrollments
        WHERE user_id = target_user_id AND course_id = current_course_id;

        WITH ordered_contents AS (
            SELECT ct.id,
                   row_number() OVER (ORDER BY m.order_index, m.id, ct.order_index, ct.id) AS position,
                   count(*) OVER () AS total
            FROM contents ct
            JOIN modules m ON m.id = ct.module_id
            WHERE m.course_id = current_course_id
        )
        INSERT INTO user_contents (
            user_id, content_id, enrollment_id, is_read, is_favorite, created_at, updated_at
        )
        SELECT target_user_id,
               oc.id,
               current_enrollment_id,
               true,
               (oc.position % 11 = 0),
               now() - ((oc.position + course_index * 9) * interval '3 hours'),
               now() - ((oc.position + course_index * 9) * interval '3 hours')
        FROM ordered_contents oc
        WHERE oc.position <= GREATEST(1, round(oc.total * course_ratio))
        ON CONFLICT (user_id, content_id) DO UPDATE SET
            enrollment_id = EXCLUDED.enrollment_id,
            is_read = true,
            is_favorite = EXCLUDED.is_favorite,
            updated_at = EXCLUDED.updated_at;

        SELECT count(*) INTO learned_count
        FROM user_contents uc
        JOIN contents ct ON ct.id = uc.content_id
        JOIN modules m ON m.id = ct.module_id
        WHERE uc.user_id = target_user_id
          AND uc.is_read
          AND m.course_id = current_course_id;

        INSERT INTO user_course_progress_projections (
            user_id, course_id, enrollment_id, value, default_locale
        ) VALUES (
            target_user_id,
            current_course_id,
            current_enrollment_id,
            jsonb_build_object(
                'totalScore', 900 + (learned_count * 35),
                'completedChallenges', CASE course_index WHEN 1 THEN 7 WHEN 2 THEN 2 ELSE 0 END,
                'lessonsRead', learned_count,
                'milestoneProgress', CASE course_index WHEN 1 THEN 2 ELSE 0 END,
                'totalXp', CASE course_index WHEN 1 THEN 6450 WHEN 2 THEN 2250 ELSE 680 END
            ),
            'vi'
        )
        ON CONFLICT (user_id, course_id) DO UPDATE SET
            enrollment_id = EXCLUDED.enrollment_id,
            value = EXCLUDED.value,
            default_locale = EXCLUDED.default_locale,
            updated_at = now();
    END LOOP;

    SELECT id INTO current_enrollment_id
    FROM enrollments
    WHERE user_id = target_user_id AND course_id = primary_course_id;

    UPDATE enrollments
    SET personal_project_github_url = 'https://github.com/starci-lab/starci-shop',
        personal_project_github_branch = 'main',
        task_plan_status = 'in_progress',
        updated_at = now()
    WHERE id = current_enrollment_id;

    FOR demo_index IN 1..array_length(demo_names, 1) LOOP
        demo_user_id := md5('starci-natural-demo-user-' || demo_index)::uuid;
        demo_name := demo_names[demo_index];

        INSERT INTO users (
            id, username, email, keycloak_id, display_name, avatar, bio,
            coin_balance, open_to_work, weekly_goal_lessons, weekly_kpi_targets
        ) VALUES (
            demo_user_id,
            'starci.learner.' || lpad(demo_index::text, 2, '0'),
            'learner.' || lpad(demo_index::text, 2, '0') || '@demo.starci.local',
            'starci-natural-demo-learner-' || lpad(demo_index::text, 2, '0'),
            demo_name,
            NULL,
            CASE demo_index % 4
                WHEN 0 THEN 'Đang chuyển hướng sang backend và system design.'
                WHEN 1 THEN 'Học đều mỗi ngày, ưu tiên nền tảng trước tốc độ.'
                WHEN 2 THEN 'Thích giải challenge và chia sẻ cách tiếp cận.'
                ELSE 'Xây sản phẩm nhỏ để biến kiến thức thành kỹ năng.'
            END,
            35 + demo_index * 12,
            (demo_index % 3 <> 0),
            4 + (demo_index % 3),
            '{"lessons":5,"studyDays":4,"challenges":2,"coding":2,"flashcards":4,"milestones":1}'::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio,
            coin_balance = EXCLUDED.coin_balance,
            open_to_work = EXCLUDED.open_to_work,
            weekly_goal_lessons = EXCLUDED.weekly_goal_lessons,
            weekly_kpi_targets = EXCLUDED.weekly_kpi_targets,
            updated_at = now();

        INSERT INTO enrollments (user_id, course_id, pricing_phase, is_enrolled)
        VALUES (demo_user_id, primary_course_id, 'earlyBird', true)
        ON CONFLICT (user_id, course_id) DO UPDATE SET is_enrolled = true, updated_at = now();

        SELECT id INTO demo_enrollment_id
        FROM enrollments
        WHERE user_id = demo_user_id AND course_id = primary_course_id;

        INSERT INTO user_course_progress_projections (
            user_id, course_id, enrollment_id, value, default_locale
        ) VALUES (
            demo_user_id,
            primary_course_id,
            demo_enrollment_id,
            jsonb_build_object(
                'totalScore', 1800 + demo_index * 410,
                'completedChallenges', 1 + (demo_index % 11),
                'lessonsRead', 8 + demo_index * 3,
                'milestoneProgress', demo_index % 5,
                'totalXp', 2700 + demo_index * 430
            ),
            'vi'
        )
        ON CONFLICT (user_id, course_id) DO UPDATE SET
            enrollment_id = EXCLUDED.enrollment_id,
            value = EXCLUDED.value,
            default_locale = EXCLUDED.default_locale,
            updated_at = now();

        INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
        VALUES (
            demo_user_id,
            'courseEnrolled',
            'natural-demo:enrolled:' || demo_user_id,
            jsonb_build_object('target', jsonb_build_object(
                'entityName', 'CourseEntity',
                'id', primary_course_id,
                'label', 'Fullstack Mastery'
            )),
            now() - (demo_index * interval '5 hours'),
            now() - (demo_index * interval '5 hours')
        )
        ON CONFLICT (type, idempotency_key) DO UPDATE SET
            payload = EXCLUDED.payload,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
    END LOOP;

    FOR day_index IN 0..6 LOOP
        INSERT INTO xp_histories (
            user_id, course_id, source, amount, points, ref_id, created_at, updated_at
        ) VALUES (
            target_user_id,
            primary_course_id,
            'lessonRead',
            3 + (day_index % 3),
            2,
            'natural-demo:lesson:' || target_user_id || ':' || day_index,
            now() - (day_index * interval '1 day'),
            now() - (day_index * interval '1 day')
        )
        ON CONFLICT (source, ref_id) DO UPDATE SET
            amount = EXCLUDED.amount,
            points = EXCLUDED.points,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;

        INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
        SELECT target_user_id,
               'lessonRead',
               'natural-demo:activity:lesson:' || target_user_id || ':' || day_index,
               jsonb_build_object('target', jsonb_build_object(
                   'entityName', 'ContentEntity',
                   'id', ct.id,
                   'label', ct.title
               )),
               now() - (day_index * interval '1 day'),
               now() - (day_index * interval '1 day')
        FROM contents ct
        JOIN modules m ON m.id = ct.module_id
        WHERE m.course_id = primary_course_id
        ORDER BY m.order_index, ct.order_index
        OFFSET day_index LIMIT 1
        ON CONFLICT (type, idempotency_key) DO UPDATE SET
            payload = EXCLUDED.payload,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
    END LOOP;

    FOR challenge_submission_id IN
        SELECT cs.id
        FROM challenge_submissions cs
        JOIN challenges ch ON ch.id = cs.challenge_id
        JOIN contents ct ON ct.id = ch.content_id
        JOIN modules m ON m.id = ct.module_id
        WHERE m.course_id = primary_course_id
        ORDER BY m.order_index, ct.order_index, ch.order_index, cs.order_index
        LIMIT 4
    LOOP
        challenge_index := challenge_index + 1;
        -- Reuse the learner-owned aggregate when an earlier manual UAT already
        -- created a draft for this authored deliverable. Creating a second row
        -- makes the runtime `findOne` read nondeterministic: it can select the
        -- empty draft while the graded attempt belongs to the seeded row.
        SELECT ucs.id
          INTO user_submission_id
          FROM user_challenge_submissions ucs
         WHERE ucs.user_id = target_user_id
           AND ucs.submission_id = challenge_submission_id
         ORDER BY (
                    SELECT count(*)
                      FROM user_challenge_submission_attempts a
                     WHERE a.user_challenge_submission_id = ucs.id
                  ) DESC,
                  ucs.updated_at DESC,
                  ucs.id
         LIMIT 1;

        user_submission_id := COALESCE(
            user_submission_id,
            md5('starci-natural-user-challenge-' || challenge_index)::uuid
        );

        -- This script owns the disposable demo identity, so collapse stale
        -- duplicate aggregates before seeding its canonical attempt. Production
        -- data is not touched and the kept row is the one with the richest
        -- existing history.
        DELETE FROM user_challenge_submissions ucs
         WHERE ucs.user_id = target_user_id
           AND ucs.submission_id = challenge_submission_id
           AND ucs.id <> user_submission_id;

        INSERT INTO user_challenge_submissions (
            id, user_id, enrollment_id, submission_id, submission_url,
            selected_model, selected_model_provider, selected_lang
        ) VALUES (
            user_submission_id,
            target_user_id,
            current_enrollment_id,
            challenge_submission_id,
            'https://github.com/starci-lab/starci-challenge-' || challenge_index,
            NULL,
            NULL,
            'typescript'
        )
        ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            enrollment_id = EXCLUDED.enrollment_id,
            submission_id = EXCLUDED.submission_id,
            submission_url = EXCLUDED.submission_url,
            updated_at = now();

        INSERT INTO user_challenge_submission_attempts (
            id, idempotency_key, attempt_number, score, short_feedback,
            processed_at, submission_url, served_model, served_provider,
            prompt_tokens, completion_tokens, user_challenge_submission_id, default_locale,
            status, platform_decision, draft_revision, submitted_at, finalization_revision
        ) VALUES (
            md5('starci-natural-challenge-attempt-' || challenge_index)::uuid,
            'natural-demo:challenge:' || challenge_index,
            1,
            78 + challenge_index * 4,
            CASE challenge_index
                WHEN 1 THEN 'Giải pháp đúng hướng; cần làm rõ transaction boundary.'
                WHEN 2 THEN 'Contract tốt và có bằng chứng test rõ ràng.'
                WHEN 3 THEN 'Xử lý failure path chắc chắn, naming có thể gọn hơn.'
                ELSE 'Hoàn thành tốt với trade-off được giải thích hợp lý.'
            END,
            now() - ((5 - challenge_index) * interval '1 day'),
            'https://github.com/starci-lab/starci-challenge-' || challenge_index,
            'auto',
            'local',
            900 + challenge_index * 80,
            420 + challenge_index * 45,
            user_submission_id,
            'vi',
            'passed',
            'passed',
            0,
            now() - ((5 - challenge_index) * interval '1 day'),
            1
        )
        ON CONFLICT (id) DO UPDATE SET
            score = EXCLUDED.score,
            short_feedback = EXCLUDED.short_feedback,
            processed_at = EXCLUDED.processed_at,
            status = EXCLUDED.status,
            platform_decision = EXCLUDED.platform_decision,
            draft_revision = EXCLUDED.draft_revision,
            submitted_at = EXCLUDED.submitted_at,
            finalization_revision = EXCLUDED.finalization_revision,
            user_challenge_submission_id = EXCLUDED.user_challenge_submission_id,
            updated_at = now();
    END LOOP;

    FOR challenge_submission_id IN
        SELECT mt.id
        FROM milestone_tasks mt
        JOIN milestones ms ON ms.id = mt.milestone_id
        WHERE ms.course_id = primary_course_id
        ORDER BY ms.order_index, mt.order_index
        LIMIT 3
    LOOP
        task_index := task_index + 1;
        user_task_id := md5('starci-natural-user-task-' || task_index)::uuid;

        INSERT INTO user_milestone_tasks (
            id, enrollment_id, milestone_task_id, order_index, sort_index
        ) VALUES (
            user_task_id, current_enrollment_id, challenge_submission_id, task_index, task_index
        )
        ON CONFLICT (id) DO UPDATE SET
            enrollment_id = EXCLUDED.enrollment_id,
            milestone_task_id = EXCLUDED.milestone_task_id,
            order_index = EXCLUDED.order_index,
            sort_index = EXCLUDED.sort_index,
            updated_at = now();

        IF task_index <= 2 THEN
            INSERT INTO user_milestone_task_attempts (
                id, idempotency_key, attempt_number, passed, score, short_feedback,
                processed_at, default_locale, user_milestone_task_id,
                served_model, served_provider, prompt_tokens, completion_tokens
            ) VALUES (
                md5('starci-natural-task-attempt-' || task_index)::uuid,
                'natural-demo:milestone:' || task_index,
                1,
                true,
                88 + task_index * 4,
                'Bài làm bám rubric, có repository và bằng chứng chạy thực tế.',
                now() - ((3 - task_index) * interval '1 day'),
                'vi',
                user_task_id,
                'auto',
                'local',
                1300 + task_index * 100,
                560 + task_index * 50
            )
            ON CONFLICT (id) DO UPDATE SET
                passed = true,
                score = EXCLUDED.score,
                short_feedback = EXCLUDED.short_feedback,
                processed_at = EXCLUDED.processed_at,
                user_milestone_task_id = EXCLUDED.user_milestone_task_id,
                updated_at = now();
        END IF;
    END LOOP;

    INSERT INTO coding_submissions (
        id, user_id, coding_problem_id, language, source_code, verdict,
        passed_count, total_count, runtime_ms, memory_kb, per_case_results
    )
    SELECT md5('starci-natural-coding-' || row_number() OVER (ORDER BY cp.id))::uuid,
           target_user_id,
           cp.id,
           'typescript',
           'export const solve = (input: unknown) => input',
           'accepted',
           8,
           8,
           24 + row_number() OVER (ORDER BY cp.id),
           6144,
           '[]'::jsonb
    FROM coding_problems cp
    ORDER BY cp.created_at, cp.id
    LIMIT 3
    ON CONFLICT (id) DO UPDATE SET
        verdict = 'accepted',
        passed_count = EXCLUDED.passed_count,
        total_count = EXCLUDED.total_count,
        runtime_ms = EXCLUDED.runtime_ms,
        memory_kb = EXCLUDED.memory_kb,
        updated_at = now();

    DELETE FROM user_stats_projections WHERE user_id = target_user_id;
    DELETE FROM user_xp_projections WHERE user_id = target_user_id;
    DELETE FROM user_solved_challenges_projections WHERE user_id = target_user_id;
    DELETE FROM user_coding_projections WHERE user_id = target_user_id;
    DELETE FROM user_achievement_projections WHERE user_id = target_user_id;
    DELETE FROM user_capstone_projections WHERE user_id = target_user_id;
    DELETE FROM user_pinned_projects_projections WHERE user_id = target_user_id;
    DELETE FROM user_challenge_progress_projections WHERE enrollment_id = current_enrollment_id;
    DELETE FROM user_contribution_projections
    WHERE user_id = target_user_id AND year = EXTRACT(YEAR FROM now())::int;
END
$seed$;

COMMIT;

SELECT
    u.email,
    (SELECT count(*) FROM users WHERE is_deleted = false) AS visible_users,
    (SELECT count(*) FROM enrollments e WHERE e.user_id = u.id AND e.is_enrolled) AS enrolled_courses,
    (SELECT count(*) FROM user_contents uc WHERE uc.user_id = u.id AND uc.is_read) AS lessons_read,
    (SELECT count(*)
       FROM user_challenge_submissions ucs
       JOIN user_challenge_submission_attempts a ON a.user_challenge_submission_id = ucs.id
      WHERE ucs.user_id = u.id AND a.score >= 80) AS passed_challenges,
    (SELECT count(*) FROM coding_submissions cs WHERE cs.user_id = u.id AND cs.verdict = 'accepted') AS coding_solved,
    (SELECT count(*)
       FROM user_milestone_task_attempts a
       JOIN user_milestone_tasks t ON t.id = a.user_milestone_task_id
       JOIN enrollments e ON e.id = t.enrollment_id
      WHERE e.user_id = u.id AND a.passed) AS project_tasks_passed,
    (SELECT count(*) FROM activities a WHERE a.user_id = u.id) AS activities,
    (SELECT count(*) FROM xp_histories x WHERE x.user_id = u.id) AS xp_events
FROM users u, starci_seed_input i
WHERE lower(u.email) = lower(i.target_email);
