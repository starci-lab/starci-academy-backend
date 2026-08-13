/**
 * Seed a stable, idempotent dashboard state for the local Keycloak test account.
 *
 * This deliberately writes the same source rows the dashboard queries read: an enrollment,
 * authored lessons, user-content reads, XP/activity history, all six weekly KPI targets, AI quota,
 * reward balance, coding progress, changelog and the course-progress projection. It invalidates
 * derived projections after writing those sources, so normal read paths rebuild them instead of
 * pinning screenshot-only JSON.
 *
 * Usage: npm run seed:dashboard-test-data -- learner@example.com
 */
import { readFile } from "node:fs/promises"
import pg from "pg"

const { Client } = pg
const TEST_EMAIL = process.argv[2] ?? process.env.DEV_TEST_ACCOUNT_EMAIL ?? "test@starci.local"

/** Read a normal env value or its Docker-secret `_FILE` counterpart. */
const secret = async (name, fallback) => {
    const direct = process.env[name]
    if (direct !== undefined && direct !== "") return direct
    const path = process.env[`${name}_FILE`]
    if (path !== undefined && path !== "") return (await readFile(path, "utf8")).trim()
    return fallback
}

const client = new Client({
    host: process.env.POSTGRESQL_PRIMARY_HOST ?? "localhost",
    port: Number(process.env.POSTGRESQL_PRIMARY_PORT ?? 5432),
    user: await secret("POSTGRESQL_PRIMARY_USERNAME", "postgres"),
    password: await secret("POSTGRESQL_PRIMARY_PASSWORD", ""),
    database: process.env.POSTGRESQL_PRIMARY_DATABASE ?? "starci-academy",
})

const IDS = {
    module: "9bf1d88c-8a7d-4b8b-a967-b5418239db01",
    codingSubmission: "9bf1d88c-8a7d-4b8b-a967-b5418239db21",
    weeklyChallenge: "9bf1d88c-8a7d-4b8b-a967-b5418239db31",
    weeklyChallengeSubmission: "9bf1d88c-8a7d-4b8b-a967-b5418239db32",
    weeklyUserSubmission: "9bf1d88c-8a7d-4b8b-a967-b5418239db33",
    weeklyAttempt: "9bf1d88c-8a7d-4b8b-a967-b5418239db34",
    lessons: [
        "9bf1d88c-8a7d-4b8b-a967-b5418239db11",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db12",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db13",
    ],
    trendingContents: [
        "9bf1d88c-8a7d-4b8b-a967-b5418239db71",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db72",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db73",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db74",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db75",
        "9bf1d88c-8a7d-4b8b-a967-b5418239db76",
    ],
}

const DEMO_LEARNERS = Array.from({ length: 10 }, (_, index) => {
    const ordinal = index + 1
    const suffix = String(ordinal).padStart(2, "0")
    return {
        id: `9bf1d88c-8a7d-4b8b-a967-b5418239db${40 + ordinal}`,
        keycloakId: `dashboard-demo-learner-${suffix}`,
        username: `starci.demo.${suffix}`,
        email: `learner.${suffix}@demo.starci.local`,
        displayName: ["An Nguyen", "Bao Tran", "Chi Le", "Dung Pham", "Giang Vo", "Ha Bui", "Khanh Do", "Linh Ho", "Minh Dao", "Nhi Vu"][index],
        coinBalance: 40 + ordinal * 15,
    }
})

const LESSONS = [
    ["terraform-basics-infrastructure", "Terraform Basics: Infrastructure as Code"],
    ["input-contract-dtos", "The input contract: DTOs and validation"],
    ["load-balanced-status-api", "Build a load-balanced status API"],
]

/** Crowd-read content remains unread by the fixture viewer so Trending can show it. */
const TRENDING_CONTENTS = [
    ["event-driven-projections", "Event-driven projections without stale reads"],
    ["graphql-cursor-pagination", "Stable GraphQL cursor pagination"],
    ["keycloak-session-boundaries", "Keycloak session boundaries in practice"],
    ["react-server-boundaries", "React server boundaries that stay predictable"],
    ["postgres-index-plans", "Reading PostgreSQL index plans with confidence"],
    ["resilient-api-contracts", "Resilient API contracts for partial failures"],
]

/** The signed-in fixture exercises the populated streak branch across consecutive local days. */
const STREAK_DAYS = 5

/** Feed/contribution activity is independent of XP streak and keeps secondary panels populated. */
const ACTIVITY_DAYS = 5

/** Targets deliberately sit above current progress so every weekly row has visible progress. */
const WEEKLY_KPI_TARGETS = {
    lessons: 5,
    studyDays: 5,
    challenges: 2,
    coding: 3,
    flashcards: 5,
    milestones: 2,
}

const CHANGELOG = [
    {
        slug: "dashboard-fixture-learning-progress",
        category: "feature",
        daysAgo: 0,
        title: { en: "Learning progress dashboard", vi: "Bảng điều khiển tiến độ học tập" },
        body: { en: "Track courses, quests, streaks and weekly goals in one place.", vi: "Theo dõi khóa học, nhiệm vụ, chuỗi ngày học và mục tiêu tuần tại một nơi." },
    },
    {
        slug: "dashboard-fixture-ai-credit",
        category: "announcement",
        daysAgo: 1,
        title: { en: "AI credit is ready", vi: "Tín dụng AI đã sẵn sàng" },
        body: { en: "Course learners can use the full local test allowance.", vi: "Học viên trong khóa có thể dùng toàn bộ hạn mức thử nghiệm cục bộ." },
    },
    {
        slug: "dashboard-fixture-resume",
        category: "fix",
        daysAgo: 2,
        title: { en: "Resume learning is faster", vi: "Tiếp tục học nhanh hơn" },
        body: { en: "Recently read lessons now stay ordered by the latest activity.", vi: "Các bài vừa đọc được sắp theo hoạt động mới nhất." },
    },
]

const main = async () => {
    await client.connect()
    await client.query("BEGIN")
    try {
        const user = await client.query("SELECT id, keycloak_id FROM users WHERE lower(email) = lower($1)", [TEST_EMAIL])
        if (user.rowCount !== 1) {
            throw new Error(`${TEST_EMAIL} is missing; run the FE seed:test-account script and sign in once first`)
        }
        const course = await client.query("SELECT id FROM courses ORDER BY created_at LIMIT 1")
        if (course.rowCount !== 1) {
            throw new Error("no authored course exists; run the normal content seed before dashboard fixtures")
        }
        const userId = user.rows[0].id
        const courseId = course.rows[0].id

        const enrollment = await client.query(
            `INSERT INTO enrollments (user_id, course_id, pricing_phase, is_enrolled)
             VALUES ($1, $2, 'earlyBird', true)
             ON CONFLICT (user_id, course_id) DO UPDATE SET is_enrolled = true, updated_at = now()
             RETURNING id`,
            [userId, courseId],
        )
        const enrollmentId = enrollment.rows[0].id

        await client.query(
            `UPDATE users
             SET avatar = NULL,
                 display_name = COALESCE(NULLIF(display_name, ''), NULLIF(username, ''), split_part(email, '@', 1)),
                 bio = COALESCE(bio, 'Learning backend systems one small win at a time.'),
                 github_username = COALESCE(github_username, 'starci-test-learner'),
                 open_to_work = true,
                 coin_balance = 105,
                 weekly_goal_lessons = 5,
                 weekly_kpi_targets = $2::jsonb,
                 streak_freezes = 0,
                 updated_at = now()
             WHERE id = $1`,
            [userId, JSON.stringify(WEEKLY_KPI_TARGETS)],
        )

        const demoEnrollments = []
        for (const learner of DEMO_LEARNERS) {
            const seededUser = await client.query(
                `INSERT INTO users
                    (id, username, email, keycloak_id, display_name, avatar, bio,
                     coin_balance, open_to_work, weekly_goal_lessons, weekly_kpi_targets)
                 VALUES ($1, $2, $3, $4, $5, NULL,
                         'Building practical skills with the StarCi community.', $6, true, 5, $7::jsonb)
                 ON CONFLICT (keycloak_id) DO UPDATE SET
                     username = EXCLUDED.username, email = EXCLUDED.email,
                     display_name = EXCLUDED.display_name, avatar = NULL,
                     bio = EXCLUDED.bio, coin_balance = EXCLUDED.coin_balance,
                     open_to_work = true, weekly_goal_lessons = 5,
                     weekly_kpi_targets = EXCLUDED.weekly_kpi_targets, updated_at = now()
                 RETURNING id`,
                [learner.id, learner.username, learner.email, learner.keycloakId,
                    learner.displayName, learner.coinBalance, JSON.stringify(WEEKLY_KPI_TARGETS)],
            )
            const demoEnrollment = await client.query(
                `INSERT INTO enrollments (user_id, course_id, pricing_phase, is_enrolled)
                 VALUES ($1, $2, 'earlyBird', true)
                 ON CONFLICT (user_id, course_id) DO UPDATE SET is_enrolled = true, updated_at = now()
                 RETURNING id`,
                [seededUser.rows[0].id, courseId],
            )
            demoEnrollments.push({ userId: seededUser.rows[0].id, enrollmentId: demoEnrollment.rows[0].id })
        }

        await client.query(
            `INSERT INTO ai_subscriptions
                (user_id, tier, status, current_period_end, auto_renew,
                 window_5h_reset_at, window_week_reset_at, credit_5h_used,
                 credit_week_used, bonus_credit_5h, bonus_credit_week, ceil_overrides)
             VALUES ($1, NULL, 'active', NULL, false,
                     now() + interval '5 hours', now() + interval '7 days', 0, 0, 0, 0, NULL)
             ON CONFLICT (user_id) DO UPDATE SET
                 tier = NULL, status = 'active', current_period_end = NULL, auto_renew = false,
                 window_5h_reset_at = EXCLUDED.window_5h_reset_at,
                 window_week_reset_at = EXCLUDED.window_week_reset_at,
                 credit_5h_used = 0, credit_week_used = 0,
                 bonus_credit_5h = 0, bonus_credit_week = 0,
                 ceil_overrides = NULL, updated_at = now()`,
            [userId],
        )

        await client.query(
            `INSERT INTO modules
                (id, title, display_id, description, order_index, sort_index, is_premium,
                 content_tier, default_locale, num_contents, course_id)
             VALUES ($1, 'Dashboard demo', 'dashboard-demo', 'Stable local dashboard fixtures',
                     900, 900, false, 'foundation', 'en', 9, $2)
             ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, num_contents = 9,
                 course_id = EXCLUDED.course_id, updated_at = now()`,
            [IDS.module, courseId],
        )

        for (const [index, [displayId, title]] of LESSONS.entries()) {
            const contentId = IDS.lessons[index]
            await client.query(
                `INSERT INTO contents
                    (id, title, display_id, description, body, order_index, sort_index,
                     default_locale, minutes_read, difficulty, is_premium, is_sandbox, module_id)
                 VALUES ($1, $2, $3, 'Local dashboard fixture', '# Dashboard fixture', $4, $4,
                         'en', 8, 'beginner', false, false, $5)
                 ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, display_id = EXCLUDED.display_id,
                     module_id = EXCLUDED.module_id, updated_at = now()`,
                [contentId, title, displayId, index + 1, IDS.module],
            )
            await client.query(
                `INSERT INTO user_contents (user_id, content_id, enrollment_id, is_read, is_favorite, updated_at)
                 VALUES ($1, $2, $3, true, false, now() - ($4 * interval '1 minute'))
                 ON CONFLICT (user_id, content_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id,
                     is_read = true, updated_at = EXCLUDED.updated_at`,
                [userId, contentId, enrollmentId, index],
            )
        }

        for (const [index, [displayId, title]] of TRENDING_CONTENTS.entries()) {
            const contentId = IDS.trendingContents[index]
            await client.query(
                `INSERT INTO contents
                    (id, title, display_id, description, body, order_index, sort_index,
                     default_locale, minutes_read, difficulty, is_premium, is_sandbox, module_id)
                 VALUES ($1, $2, $3, 'Explore dashboard fixture', '# Explore fixture', $4, $4,
                         'en', 10, 'intermediate', false, false, $5)
                 ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, display_id = EXCLUDED.display_id,
                     module_id = EXCLUDED.module_id, updated_at = now()`,
                [contentId, title, displayId, LESSONS.length + index + 1, IDS.module],
            )

            // Descending crowd sizes produce a deterministic ranked board while every candidate
            // remains unread by the signed-in viewer, exactly as the production query expects.
            const readers = demoEnrollments.slice(0, DEMO_LEARNERS.length - index)
            for (const [readerIndex, learner] of readers.entries()) {
                await client.query(
                    `INSERT INTO user_contents (user_id, content_id, enrollment_id, is_read, is_favorite, updated_at)
                     VALUES ($1, $2, $3, true, false, now() - ($4 * interval '1 hour'))
                     ON CONFLICT (user_id, content_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id,
                         is_read = true, updated_at = EXCLUDED.updated_at`,
                    [learner.userId, contentId, learner.enrollmentId, readerIndex + index],
                )
            }
        }

        // Explore reads the public activity ledger, not an FE fixture. Thirty idempotent events
        // span several days and activity categories so tabs, filters and cursor pagination all
        // have meaningful production-shaped data.
        for (const [learnerIndex, learner] of demoEnrollments.entries()) {
            const contentIndex = learnerIndex % IDS.trendingContents.length
            const activities = [
                {
                    type: "lessonRead",
                    target: {
                        entityName: "ContentEntity",
                        id: IDS.trendingContents[contentIndex],
                        label: TRENDING_CONTENTS[contentIndex][1],
                    },
                },
                {
                    type: "challengePassed",
                    target: {
                        entityName: "ChallengeEntity",
                        id: IDS.weeklyChallenge,
                        label: "Build a resilient status endpoint",
                    },
                },
                {
                    type: "courseEnrolled",
                    target: {
                        entityName: "CourseEntity",
                        id: courseId,
                        label: "StarCi Academy",
                    },
                },
            ]
            for (const [activityIndex, activity] of activities.entries()) {
                const hoursAgo = learnerIndex * 3 + activityIndex
                await client.query(
                    `INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
                     VALUES ($1, $2::activity_type, $3, $4::jsonb,
                             now() - ($5 * interval '1 hour'), now() - ($5 * interval '1 hour'))
                     ON CONFLICT (type, idempotency_key) DO UPDATE SET
                         user_id = EXCLUDED.user_id, payload = EXCLUDED.payload,
                         created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                    [learner.userId, activity.type,
                        `dashboard-test:explore:${learner.userId}:${activityIndex}`,
                        JSON.stringify({ target: activity.target }), hoursAgo],
                )
            }
        }

        // Force the next normal query to rebuild the global rolling-seven-day ranking.
        await client.query("DELETE FROM trending_contents_projections WHERE key = 'global'")

        // Keep the weekly event on its real read model. A challenge, its submission slot and one
        // processed passing attempt make the deterministic weekly picker, leaderboard and reward
        // eligibility all exercise the same joins production uses.
        await client.query(
            `INSERT INTO challenges
                (id, title, display_id, description, score, difficulty, order_index, sort_index,
                 default_locale, outcome_criteria, approach_criteria, hint, verified, content_id)
             VALUES ($1, 'Build a resilient status endpoint', 'dashboard-weekly-status',
                     'Ship a typed status endpoint with graceful dependency fallbacks.',
                     100, 'medium', 900, 900, 'en', NULL, NULL,
                     'Keep each dependency failure isolated.', now(), $2)
             ON CONFLICT (id) DO UPDATE SET
                 title = EXCLUDED.title, description = EXCLUDED.description,
                 content_id = EXCLUDED.content_id, updated_at = now()`,
            [IDS.weeklyChallenge, IDS.lessons[2]],
        )
        const pickedWeeklyChallenge = await client.query(
            `SELECT id
             FROM challenges
             ORDER BY id ASC
             OFFSET (EXTRACT(WEEK FROM now())::int % (SELECT count(*)::int FROM challenges))
             LIMIT 1`,
        )
        const weeklyChallengeId = pickedWeeklyChallenge.rows[0].id
        await client.query(
            `INSERT INTO challenge_submissions
                (id, type, title, description, score, approach_score, outcome_score,
                 order_index, sort_index, challenge_id)
             VALUES ($1, 'githubUrl', 'Status endpoint repository',
                     'Submit the repository containing the completed endpoint.',
                     100, 70, 30, 1, 1, $2)
             ON CONFLICT (id) DO UPDATE SET
                 title = EXCLUDED.title, challenge_id = EXCLUDED.challenge_id, updated_at = now()`,
            [IDS.weeklyChallengeSubmission, weeklyChallengeId],
        )
        await client.query(
            `INSERT INTO user_challenge_submissions
                (id, user_id, enrollment_id, submission_id, submission_url,
                 selected_model, selected_model_provider, selected_lang)
             VALUES ($1, $2, $3, $4, 'https://github.com/starci-lab/dashboard-fixture',
                     NULL, NULL, 'typescript')
             ON CONFLICT (id) DO UPDATE SET
                 user_id = EXCLUDED.user_id, enrollment_id = EXCLUDED.enrollment_id,
                 submission_id = EXCLUDED.submission_id, updated_at = now()`,
            [IDS.weeklyUserSubmission, userId, enrollmentId, IDS.weeklyChallengeSubmission],
        )
        await client.query(
            `INSERT INTO user_challenge_submission_attempts
                (id, idempotency_key, attempt_number, score, short_feedback, processed_at,
                 submission_url, served_model, served_provider, prompt_tokens, completion_tokens,
                 user_challenge_submission_id, default_locale)
             VALUES ($1, 'dashboard-weekly-pass', 1, 92, 'Dashboard fixture pass', now(),
                     'https://github.com/starci-lab/dashboard-fixture', NULL, NULL, NULL, NULL,
                     $2, 'en')
             ON CONFLICT (id) DO UPDATE SET
                 score = EXCLUDED.score, processed_at = now(),
                 user_challenge_submission_id = EXCLUDED.user_challenge_submission_id,
                 updated_at = now()`,
            [IDS.weeklyAttempt, IDS.weeklyUserSubmission],
        )

        for (const [index, learner] of demoEnrollments.slice(0, 4).entries()) {
            const ordinal = index + 1
            const submissionId = `9bf1d88c-8a7d-4b8b-a967-b5418239db${50 + ordinal}`
            const attemptId = `9bf1d88c-8a7d-4b8b-a967-b5418239db${60 + ordinal}`
            await client.query(
                `INSERT INTO user_challenge_submissions
                    (id, user_id, enrollment_id, submission_id, submission_url,
                     selected_model, selected_model_provider, selected_lang)
                 VALUES ($1, $2, $3, $4, $5, NULL, NULL, 'typescript')
                 ON CONFLICT (id) DO UPDATE SET
                     user_id = EXCLUDED.user_id, enrollment_id = EXCLUDED.enrollment_id,
                     submission_id = EXCLUDED.submission_id, submission_url = EXCLUDED.submission_url,
                     updated_at = now()`,
                [submissionId, learner.userId, learner.enrollmentId, IDS.weeklyChallengeSubmission,
                    `https://github.com/starci-lab/demo-weekly-passer-${ordinal}`],
            )
            await client.query(
                `INSERT INTO user_challenge_submission_attempts
                    (id, idempotency_key, attempt_number, score, short_feedback, processed_at,
                     submission_url, user_challenge_submission_id, default_locale)
                 VALUES ($1, $2, 1, $3, 'Demo weekly challenge pass', now(), $4, $5, 'en')
                 ON CONFLICT (id) DO UPDATE SET
                     score = EXCLUDED.score, processed_at = now(),
                     user_challenge_submission_id = EXCLUDED.user_challenge_submission_id,
                     updated_at = now()`,
                [attemptId, `dashboard-weekly-pass-${ordinal}`, 86 + ordinal,
                    `https://github.com/starci-lab/demo-weekly-passer-${ordinal}`, submissionId],
            )
        }

        // Rebuild the fixture XP rows so the account has a deterministic current streak and
        // today's quest reads from the same ledger as production.
        await client.query(
            "DELETE FROM xp_histories WHERE user_id = $1 AND (ref_id LIKE $2 OR ref_id LIKE $3)",
            [userId, `dashboard-test:${userId}:%`, `dashboard:${userId}:%`],
        )
        for (let dayOffset = 0; dayOffset < STREAK_DAYS; dayOffset += 1) {
            await client.query(
                `INSERT INTO xp_histories
                    (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
                 VALUES ($1, $2, 'lessonRead', 3, 2, $3,
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))`,
                [userId, courseId, `dashboard:${userId}:lesson:${dayOffset}`, dayOffset],
            )
        }
        await client.query(
            `INSERT INTO xp_histories
                (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
             VALUES ($1, $2, 'challenge', 92, 5, $3, now(), now())`,
            [userId, courseId, `dashboard:${userId}:challenge`],
        )

        for (let dayOffset = 0; dayOffset < ACTIVITY_DAYS; dayOffset += 1) {
            const contentIndex = dayOffset % IDS.lessons.length
            await client.query(
                `INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
                 VALUES ($1, 'lessonRead', $2, $3::jsonb,
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                     user_id = EXCLUDED.user_id, payload = EXCLUDED.payload,
                     created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [
                    userId,
                    `dashboard-test:${userId}:activity:lesson:${dayOffset}`,
                    JSON.stringify({
                        target: {
                            entityName: "ContentEntity",
                            id: IDS.lessons[contentIndex],
                            label: LESSONS[contentIndex][1],
                        },
                    }),
                    dayOffset,
                ],
            )
        }

        const codingProblem = await client.query(
            "SELECT id, title FROM coding_problems ORDER BY created_at LIMIT 1",
        )
        const hasCodingProblem = codingProblem.rowCount === 1
        if (hasCodingProblem) {
            await client.query(
                `INSERT INTO coding_submissions
                    (id, user_id, coding_problem_id, language, source_code, verdict,
                     passed_count, total_count, runtime_ms, memory_kb, per_case_results)
                 VALUES ($1, $2, $3, 'typescript', $4, 'accepted', 4, 4, 18, 4096, '[]')
                 ON CONFLICT (id) DO UPDATE SET
                     user_id = EXCLUDED.user_id, coding_problem_id = EXCLUDED.coding_problem_id,
                     language = EXCLUDED.language, source_code = EXCLUDED.source_code,
                     verdict = EXCLUDED.verdict, passed_count = EXCLUDED.passed_count,
                     total_count = EXCLUDED.total_count, runtime_ms = EXCLUDED.runtime_ms,
                     memory_kb = EXCLUDED.memory_kb, updated_at = now()`,
                [
                    IDS.codingSubmission,
                    userId,
                    codingProblem.rows[0].id,
                    "export const solve = () => 'dashboard-fixture'",
                ],
            )
            await client.query(
                `INSERT INTO activities (user_id, type, idempotency_key, payload)
                 VALUES ($1, 'codingSolved', $2, $3::jsonb)
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                     user_id = EXCLUDED.user_id, payload = EXCLUDED.payload, updated_at = now()`,
                [
                    userId,
                    `dashboard-test:${userId}:activity:coding`,
                    JSON.stringify({
                        target: {
                            entityName: "CodingProblemEntity",
                            id: codingProblem.rows[0].id,
                            label: codingProblem.rows[0].title,
                        },
                    }),
                ],
            )
        }

        for (const entry of CHANGELOG) {
            await client.query(
                `INSERT INTO changelog_entries
                    (slug, title, body, category, published_at, link_url, is_published)
                 VALUES ($1, $2::jsonb, $3::jsonb, $4,
                         now() - ($5 * interval '1 day'), NULL, true)
                 ON CONFLICT (slug) DO UPDATE SET
                     title = EXCLUDED.title, body = EXCLUDED.body,
                     category = EXCLUDED.category, published_at = EXCLUDED.published_at,
                     link_url = NULL, is_published = true, updated_at = now()`,
                [entry.slug, JSON.stringify(entry.title), JSON.stringify(entry.body), entry.category, entry.daysAgo],
            )
        }
        await client.query(
            `INSERT INTO user_course_progress_projections
                (user_id, course_id, enrollment_id, value, default_locale)
             VALUES ($1, $2, $3, $4::jsonb, 'en')
             ON CONFLICT (user_id, course_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id,
                 value = EXCLUDED.value, updated_at = now()`,
            [userId, courseId, enrollmentId, JSON.stringify({
                totalScore: 10,
                completedChallenges: 1,
                lessonsRead: 3,
                milestoneProgress: 0,
                totalXp: 19,
            })],
        )

        // The projection is derived from the source rows above. Removing the old snapshot makes
        // the ordinary TTL-safe read path recompute it immediately after this transaction.
        await client.query("DELETE FROM user_stats_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_xp_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_solved_challenges_projections WHERE user_id = $1", [userId])
        await client.query(
            "DELETE FROM user_contribution_projections WHERE user_id = $1 AND year = EXTRACT(YEAR FROM now())::int",
            [userId],
        )

        const verification = await client.query(
            `SELECT
                (SELECT weekly_kpi_targets FROM users WHERE id = $1) AS targets,
                (SELECT count(*)::int FROM user_contents WHERE user_id = $1 AND is_read = true) AS learned,
                (SELECT count(*)::int FROM xp_histories WHERE user_id = $1 AND ref_id LIKE $2) AS fixture_xp,
                (SELECT count(*)::int FROM activities WHERE user_id = $1 AND idempotency_key LIKE $3) AS activities,
                (SELECT count(*)::int FROM changelog_entries WHERE slug LIKE 'dashboard-fixture-%' AND is_published) AS changelog,
                (SELECT count(*)::int FROM ai_subscriptions WHERE user_id = $1 AND credit_5h_used = 0 AND credit_week_used = 0) AS quota,
                (SELECT count(*)::int FROM users WHERE keycloak_id LIKE 'dashboard-demo-learner-%') AS demo_learners,
                (SELECT count(*)::int FROM activities WHERE idempotency_key LIKE 'dashboard-test:explore:%') AS explore_activities,
                (SELECT count(*)::int FROM user_contents WHERE content_id = ANY($6::uuid[]) AND is_read = true) AS trending_reads,
                (SELECT count(*)::int
                 FROM user_challenge_submissions ucs
                 JOIN user_challenge_submission_attempts a ON a.user_challenge_submission_id = ucs.id
                 WHERE ucs.submission_id = $4 AND a.score >= 80
                   AND ucs.user_id = ANY($5::uuid[])) AS fixture_passers`,
            [userId, `dashboard:${userId}:%`, `dashboard-test:${userId}:%`,
                IDS.weeklyChallengeSubmission, [userId, ...demoEnrollments.slice(0, 4).map((entry) => entry.userId)],
                IDS.trendingContents],
        )
        const seeded = verification.rows[0]
        if (
            Object.keys(seeded.targets ?? {}).length !== 6
            || seeded.learned < LESSONS.length
            || seeded.fixture_xp !== STREAK_DAYS + 1
            || seeded.activities < 5
            || seeded.changelog !== CHANGELOG.length
            || seeded.quota !== 1
            || seeded.demo_learners !== DEMO_LEARNERS.length
            || seeded.explore_activities !== DEMO_LEARNERS.length * 3
            || seeded.trending_reads !== 45
            || seeded.fixture_passers !== 5
        ) {
            throw new Error(`dashboard seed verification failed: ${JSON.stringify(seeded)}`)
        }

        await client.query("COMMIT")
        console.log(
            `seeded dashboard for ${TEST_EMAIL}: 10 demo learners, 5 weekly passers, 3 resume lessons, ${STREAK_DAYS}-day streak, 6 weekly goals, 105 coins, AI quota reset${hasCodingProblem ? ", coding progress" : ""}`,
        )
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        await client.end()
    }
}

main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
