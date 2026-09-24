/**
 * Seed an idempotent, production-shaped public profile from existing mounted curriculum data.
 * No course, lesson, challenge, milestone, task, or coding problem is invented here.
 *
 * Usage: npm run seed:profile-test-data -- cuongnvtse160875
 */
import { readFile } from "node:fs/promises"
import pg from "pg"

const { Client } = pg
const username = process.argv[2] ?? "cuongnvtse160875"

const secret = async (name, fallback = "") => {
    const direct = process.env[name]
    if (direct) return direct
    const file = process.env[`${name}_FILE`]
    return file ? (await readFile(file, "utf8")).trim() : fallback
}

const client = new Client({
    host: process.env.POSTGRESQL_PRIMARY_HOST ?? "localhost",
    port: Number(process.env.POSTGRESQL_PRIMARY_PORT ?? 5432),
    user: await secret("POSTGRESQL_PRIMARY_USERNAME", "postgres"),
    password: await secret("POSTGRESQL_PRIMARY_PASSWORD"),
    database: process.env.POSTGRESQL_PRIMARY_DATABASE ?? "starci-academy",
})

const ids = {
    pins: {
        course: "7ed00000-0000-4000-8000-000000000001",
        external: "7ed00000-0000-4000-8000-000000000002",
    },
    challengeSubmissions: [
        "7ed00000-0000-4000-8000-000000000011",
        "7ed00000-0000-4000-8000-000000000012",
        "7ed00000-0000-4000-8000-000000000013",
    ],
    challengeAttempts: [
        "7ed00000-0000-4000-8000-000000000021",
        "7ed00000-0000-4000-8000-000000000022",
        "7ed00000-0000-4000-8000-000000000023",
    ],
    codingSubmissions: [
        "7ed00000-0000-4000-8000-000000000031",
        "7ed00000-0000-4000-8000-000000000032",
        "7ed00000-0000-4000-8000-000000000033",
    ],
    milestoneTasks: [
        "7ed00000-0000-4000-8000-000000000041",
        "7ed00000-0000-4000-8000-000000000042",
        "7ed00000-0000-4000-8000-000000000043",
    ],
    milestoneAttempts: [
        "7ed00000-0000-4000-8000-000000000051",
        "7ed00000-0000-4000-8000-000000000052",
        "7ed00000-0000-4000-8000-000000000053",
    ],
    systemDesignMilestoneTasks: [
        "7ed00000-0000-4000-8000-000000000061",
        "7ed00000-0000-4000-8000-000000000062",
        "7ed00000-0000-4000-8000-000000000063",
        "7ed00000-0000-4000-8000-000000000064",
        "7ed00000-0000-4000-8000-000000000065",
    ],
    systemDesignMilestoneAttempts: [
        "7ed00000-0000-4000-8000-000000000071",
        "7ed00000-0000-4000-8000-000000000072",
        "7ed00000-0000-4000-8000-000000000073",
        "7ed00000-0000-4000-8000-000000000074",
        "7ed00000-0000-4000-8000-000000000075",
    ],
    achievementAwards: [
        "7ed00000-0000-4000-8000-000000000081",
        "7ed00000-0000-4000-8000-000000000082",
        "7ed00000-0000-4000-8000-000000000083",
        "7ed00000-0000-4000-8000-000000000084",
        "7ed00000-0000-4000-8000-000000000085",
        "7ed00000-0000-4000-8000-000000000086",
    ],
}

const UAT_RARITY_COMPANIONS = [
    {
        id: "7ed00000-0000-4000-8000-000000000091",
        keycloakId: "profile-fixture-r10-rarity-a",
        username: "profile.fixture.r10.rarity.a",
        email: "profile.fixture.r10.rarity.a@uat.starci.local",
        displayName: "Profile Fixture R10 Rarity A",
    },
    {
        id: "7ed00000-0000-4000-8000-000000000092",
        keycloakId: "profile-fixture-r10-rarity-b",
        username: "profile.fixture.r10.rarity.b",
        email: "profile.fixture.r10.rarity.b@uat.starci.local",
        displayName: "Profile Fixture R10 Rarity B",
    },
]

// Keep the public timeline human-shaped while remaining deterministic. These
// minutes are applied in the learner's UAT timezone, rather than inheriting the
// single seed-run clock for every event.
const UAT_ACTIVITY_MINUTES = {
    lessons: [560, 1065, 730, 515, 1085, 880, 615, 1225],
    challenges: [1145, 930, 1270],
    coding: [705, 1040, 835],
}

const main = async () => {
    await client.connect()
    await client.query("BEGIN")
    try {
        const profileResult = await client.query(
            `SELECT u.id AS user_id, e.id AS enrollment_id, c.id AS course_id, c.title
             FROM users u
             JOIN enrollments e ON e.user_id = u.id AND e.is_enrolled = true
             JOIN courses c ON c.id = e.course_id
             WHERE u.username = $1 AND c.display_id = 'fullstack-mastery'
             LIMIT 1`,
            [username],
        )
        if (profileResult.rowCount !== 1) {
            throw new Error(`No Fullstack Mastery enrollment found for ${username}`)
        }
        const { user_id: userId, enrollment_id: enrollmentId, course_id: courseId } = profileResult.rows[0]
        const seedKey = `profile:${userId.slice(0, 8)}`

        const systemDesignCourse = (await client.query(
            `SELECT id, title
             FROM courses
             WHERE display_id = 'system-design-mastery'
             LIMIT 1`,
        )).rows[0]
        if (!systemDesignCourse) {
            throw new Error("System Design Mastery is required for the populated profile fixture")
        }
        const systemDesignEnrollment = (await client.query(
            `INSERT INTO enrollments (user_id, course_id, pricing_phase, is_enrolled)
             VALUES ($1, $2, 'earlyBird', true)
             ON CONFLICT (user_id, course_id) DO UPDATE
                SET is_enrolled = true, updated_at = now()
             RETURNING id`,
            [userId, systemDesignCourse.id],
        )).rows[0]

        const contents = (await client.query(
            `SELECT x.id, x.title
             FROM contents x
             JOIN modules m ON m.id = x.module_id
             WHERE m.course_id = $1
             ORDER BY m.order_index, x.order_index, x.id
             LIMIT 8`,
            [courseId],
        )).rows
        const challenges = (await client.query(
            `SELECT ch.id AS challenge_id, ch.title, cs.id AS submission_id
             FROM challenges ch
             JOIN challenge_submissions cs ON cs.challenge_id = ch.id
             JOIN contents x ON x.id = ch.content_id
             JOIN modules m ON m.id = x.module_id
             WHERE m.course_id = $1
             ORDER BY m.order_index, x.order_index, ch.order_index, cs.order_index
             LIMIT 3`,
            [courseId],
        )).rows
        const codingProblems = (await client.query(
            `SELECT id, slug, title, difficulty
             FROM coding_problems
             WHERE enabled = true AND slug NOT LIKE 'seed-%'
             ORDER BY CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                      order_index, created_at
             LIMIT 3`,
        )).rows
        const milestoneTasks = (await client.query(
            `SELECT mt.id, mt.title
             FROM milestone_tasks mt
             JOIN milestones mi ON mi.id = mt.milestone_id
             WHERE mi.course_id = $1
             ORDER BY mi.order_index, mt.order_index, mt.id
             LIMIT 3`,
            [courseId],
        )).rows
        const systemDesignMilestoneTasks = (await client.query(
            `SELECT mt.id, mt.title
             FROM milestone_tasks mt
             JOIN milestones mi ON mi.id = mt.milestone_id
             WHERE mi.course_id = $1
             ORDER BY mi.order_index, mt.order_index, mt.id
             LIMIT 5`,
            [systemDesignCourse.id],
        )).rows

        if (contents.length < 8 || challenges.length < 3 || codingProblems.length < 3
            || milestoneTasks.length < 3 || systemDesignMilestoneTasks.length < 5) {
            throw new Error("Mounted curriculum is incomplete; refusing to invent profile evidence")
        }

        await client.query(
            `INSERT INTO user_pinned_projects
                (id, type, order_index, user_id, enrollment_id)
             VALUES ($1, 'course', 0, $2, $3)
             ON CONFLICT (id) DO UPDATE SET
                type = EXCLUDED.type, order_index = 0, user_id = EXCLUDED.user_id,
                enrollment_id = EXCLUDED.enrollment_id, title = NULL, description = NULL,
                url = NULL, tech_stack = NULL, updated_at = now()`,
            [ids.pins.course, userId, enrollmentId],
        )
        await client.query(
            `INSERT INTO user_pinned_projects
                (id, type, title, description, url, tech_stack, order_index, user_id)
             VALUES ($1, 'external', $2, $3, $4, $5::jsonb, 1, $6)
             ON CONFLICT (id) DO UPDATE SET
                type = EXCLUDED.type, title = EXCLUDED.title, description = EXCLUDED.description,
                url = EXCLUDED.url, tech_stack = EXCLUDED.tech_stack, order_index = 1,
                user_id = EXCLUDED.user_id, enrollment_id = NULL, updated_at = now()`,
            [ids.pins.external, "Observability Notebook", "A production-shaped tracing and reliability portfolio.",
                "https://github.com/starci-lab/observability-notebook",
                JSON.stringify(["TypeScript", "OpenTelemetry", "PostgreSQL"]), userId],
        )

        for (const [index, content] of contents.entries()) {
            await client.query(
                `INSERT INTO user_contents
                    (user_id, content_id, enrollment_id, is_read, is_favorite, created_at, updated_at)
                 VALUES ($1, $2, $3, true, $4, now() - ($5 * interval '1 day'), now() - ($5 * interval '1 day'))
                 ON CONFLICT (user_id, content_id) DO UPDATE SET
                    enrollment_id = EXCLUDED.enrollment_id, is_read = true,
                    is_favorite = EXCLUDED.is_favorite, updated_at = EXCLUDED.updated_at`,
                [userId, content.id, enrollmentId, index === 1, 7 - index],
            )
            await client.query(
                `INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
                 VALUES ($1, 'lessonRead', $2, $3::jsonb,
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'),
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    user_id = EXCLUDED.user_id, payload = EXCLUDED.payload,
                    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:lesson:${index}`,
                    JSON.stringify({ target: { entityName: "ContentEntity", id: content.id, label: content.title } }),
                    7 - index, UAT_ACTIVITY_MINUTES.lessons[index]],
            )
            await client.query(
                `INSERT INTO xp_histories
                    (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
                 VALUES ($1, $2, 'lessonRead', 3, 2, $3,
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (source, ref_id) DO UPDATE SET
                    user_id = EXCLUDED.user_id, course_id = EXCLUDED.course_id,
                    amount = EXCLUDED.amount, points = EXCLUDED.points,
                    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, courseId, `${seedKey}:lesson:${index}`, 7 - index],
            )
        }

        for (const [index, challenge] of challenges.entries()) {
            const url = `https://github.com/starci-lab/fullstack-mastery/tree/profile-proof-${index + 1}`
            await client.query(
                `INSERT INTO user_challenge_submissions
                    (id, user_id, enrollment_id, submission_id, submission_url, selected_lang)
                 VALUES ($1, $2, $3, $4, $5, 'typescript')
                 ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id, enrollment_id = EXCLUDED.enrollment_id,
                    submission_id = EXCLUDED.submission_id, submission_url = EXCLUDED.submission_url,
                    selected_lang = EXCLUDED.selected_lang, updated_at = now()`,
                [ids.challengeSubmissions[index], userId, enrollmentId, challenge.submission_id, url],
            )
            await client.query(
                `INSERT INTO user_challenge_submission_attempts
                    (id, idempotency_key, attempt_number, score, short_feedback, processed_at,
                     submission_url, user_challenge_submission_id, default_locale, created_at, updated_at)
                 VALUES ($1, $2, 1, $3, $4, now() - ($5 * interval '1 day'),
                         $6, $7, 'en', now() - ($5 * interval '1 day'), now() - ($5 * interval '1 day'))
                 ON CONFLICT (id) DO UPDATE SET
                    score = EXCLUDED.score, short_feedback = EXCLUDED.short_feedback,
                    processed_at = EXCLUDED.processed_at, submission_url = EXCLUDED.submission_url,
                    user_challenge_submission_id = EXCLUDED.user_challenge_submission_id,
                    updated_at = EXCLUDED.updated_at`,
                [ids.challengeAttempts[index], `${seedKey}:challenge:${index}`,
                    88 + index * 4, "Passed against the authored challenge criteria.", 5 - index,
                    url, ids.challengeSubmissions[index]],
            )
            await client.query(
                `INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
                 VALUES ($1, 'challengePassed', $2, $3::jsonb,
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'),
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    payload = EXCLUDED.payload, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:challenge:${index}`,
                    JSON.stringify({ target: { entityName: "ChallengeEntity", id: challenge.challenge_id, label: challenge.title } }),
                    5 - index, UAT_ACTIVITY_MINUTES.challenges[index]],
            )
            await client.query(
                `INSERT INTO xp_histories (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
                 VALUES ($1, $2, 'challenge', $3, 5, $4,
                         now() - ($5 * interval '1 day'), now() - ($5 * interval '1 day'))
                 ON CONFLICT (source, ref_id) DO UPDATE SET amount = EXCLUDED.amount,
                    points = EXCLUDED.points, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, courseId, 88 + index * 4, `${seedKey}:challenge:${index}`, 5 - index],
            )
        }

        for (const [index, problem] of codingProblems.entries()) {
            await client.query(
                `INSERT INTO coding_submissions
                    (id, user_id, coding_problem_id, language, source_code, verdict,
                     passed_count, total_count, runtime_ms, memory_kb, per_case_results,
                     created_at, updated_at)
                 VALUES ($1, $2, $3, 'typescript', $4, 'accepted', 12, 12,
                         $5, $6, '[]', now() - ($7 * interval '1 day'), now() - ($7 * interval '1 day'))
                 ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id, coding_problem_id = EXCLUDED.coding_problem_id,
                    verdict = 'accepted', passed_count = 12, total_count = 12,
                    runtime_ms = EXCLUDED.runtime_ms, memory_kb = EXCLUDED.memory_kb,
                    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [ids.codingSubmissions[index], userId, problem.id,
                    `// Accepted local profile seed for ${problem.slug}\nexport function solve(input) { return input }`,
                    24 + index * 7, 4096 + index * 512, 4 - index],
            )
            await client.query(
                `INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
                 VALUES ($1, 'codingSolved', $2, $3::jsonb,
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'),
                         (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok')
                            - ($4 * interval '1 day') + ($5 * interval '1 minute'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    payload = EXCLUDED.payload, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:coding:${index}`,
                    JSON.stringify({ target: { entityName: "CodingProblemEntity", id: problem.id, label: problem.title } }),
                    4 - index, UAT_ACTIVITY_MINUTES.coding[index]],
            )
            await client.query(
                `INSERT INTO xp_histories (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
                 VALUES ($1, $2, 'coding', 10, 3, $3,
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (source, ref_id) DO UPDATE SET
                    amount = EXCLUDED.amount, points = EXCLUDED.points,
                    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, courseId, `${seedKey}:coding:${index}`, 4 - index],
            )
        }

        for (const [index, task] of milestoneTasks.entries()) {
            await client.query(
                `INSERT INTO user_milestone_tasks
                    (id, enrollment_id, milestone_task_id, order_index, sort_index)
                 VALUES ($1, $2, $3, $4, $4)
                 ON CONFLICT (id) DO UPDATE SET
                    enrollment_id = EXCLUDED.enrollment_id,
                    milestone_task_id = EXCLUDED.milestone_task_id,
                    order_index = EXCLUDED.order_index, sort_index = EXCLUDED.sort_index,
                    updated_at = now()`,
                [ids.milestoneTasks[index], enrollmentId, task.id, index],
            )
            if (index < 3) {
                await client.query(
                    `INSERT INTO user_milestone_task_attempts
                        (id, idempotency_key, attempt_number, passed, score, short_feedback,
                         processed_at, default_locale, user_milestone_task_id)
                     VALUES ($1, $2, 1, true, $3, 'Project task passed against the authored rubric.',
                             now() - ($4 * interval '1 day'), 'en', $5)
                     ON CONFLICT (id) DO UPDATE SET
                        passed = true, score = EXCLUDED.score,
                        short_feedback = EXCLUDED.short_feedback,
                        processed_at = EXCLUDED.processed_at,
                        user_milestone_task_id = EXCLUDED.user_milestone_task_id,
                        updated_at = now()`,
                    [ids.milestoneAttempts[index], `${seedKey}:milestone:${index}`,
                        91 + index * 4, 2 - index, ids.milestoneTasks[index]],
                )
            }
        }

        for (const [index, task] of systemDesignMilestoneTasks.entries()) {
            await client.query(
                `INSERT INTO user_milestone_tasks
                    (id, enrollment_id, milestone_task_id, order_index, sort_index)
                 VALUES ($1, $2, $3, $4, $4)
                 ON CONFLICT (id) DO UPDATE SET
                    enrollment_id = EXCLUDED.enrollment_id,
                    milestone_task_id = EXCLUDED.milestone_task_id,
                    order_index = EXCLUDED.order_index, sort_index = EXCLUDED.sort_index,
                    updated_at = now()`,
                [ids.systemDesignMilestoneTasks[index], systemDesignEnrollment.id, task.id, index],
            )
            await client.query(
                `INSERT INTO user_milestone_task_attempts
                    (id, idempotency_key, attempt_number, passed, score, short_feedback,
                     processed_at, default_locale, user_milestone_task_id)
                 VALUES ($1, $2, 1, true, $3, 'System-design project task passed against the authored rubric.',
                         now() - ($4 * interval '1 day'), 'en', $5)
                 ON CONFLICT (id) DO UPDATE SET
                    passed = true, score = EXCLUDED.score,
                    short_feedback = EXCLUDED.short_feedback,
                    processed_at = EXCLUDED.processed_at,
                    user_milestone_task_id = EXCLUDED.user_milestone_task_id,
                    updated_at = now()`,
                [ids.systemDesignMilestoneAttempts[index], `${seedKey}:system-design-milestone:${index}`,
                    86 + index * 2, 6 - index, ids.systemDesignMilestoneTasks[index]],
            )
        }

        const achievementRows = (await client.query(
            `SELECT id, slug
             FROM achievements
             WHERE slug = ANY($1::varchar[])
             ORDER BY slug`,
            [["baby-duckling", "crowned-owl", "sword-shark"]],
        )).rows
        if (achievementRows.length !== 3) {
            throw new Error("Required achievement definitions are missing")
        }
        const achievementBySlug = new Map(achievementRows.map((achievement) => [achievement.slug, achievement.id]))
        for (const companion of UAT_RARITY_COMPANIONS) {
            await client.query(
                `INSERT INTO users (id, username, email, keycloak_id, display_name, bio)
                 VALUES ($1, $2, $3, $4, $5, 'Isolated UAT rarity companion.')
                 ON CONFLICT (keycloak_id) DO UPDATE SET
                    username = EXCLUDED.username, email = EXCLUDED.email,
                    display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, updated_at = now()`,
                [companion.id, companion.username, companion.email, companion.keycloakId, companion.displayName],
            )
        }
        const awards = [
            [ids.achievementAwards[0], userId, achievementBySlug.get("baby-duckling"), null],
            [ids.achievementAwards[1], userId, achievementBySlug.get("sword-shark"), 2],
            [ids.achievementAwards[2], userId, achievementBySlug.get("crowned-owl"), 3],
            [ids.achievementAwards[3], UAT_RARITY_COMPANIONS[0].id, achievementBySlug.get("baby-duckling"), null],
            [ids.achievementAwards[4], UAT_RARITY_COMPANIONS[1].id, achievementBySlug.get("baby-duckling"), null],
            [ids.achievementAwards[5], UAT_RARITY_COMPANIONS[1].id, achievementBySlug.get("sword-shark"), 1],
        ]
        for (const [id, awardUserId, achievementId, tier] of awards) {
            await client.query(
                `INSERT INTO user_achievements (id, user_id, achievement_id, tier, earned_at)
                 VALUES ($1, $2, $3, $4, now() - ($5 * interval '1 day'))
                 ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id, achievement_id = EXCLUDED.achievement_id,
                    tier = EXCLUDED.tier, earned_at = EXCLUDED.earned_at, updated_at = now()`,
                [id, awardUserId, achievementId, tier, tier ?? 0],
            )
        }

        await client.query(
            `UPDATE enrollments
             SET personal_project_github_url = 'https://github.com/starci-lab/starci-shop',
                 personal_project_github_branch = 'main', task_plan_status = 'in_progress', updated_at = now()
             WHERE id = $1`,
            [enrollmentId],
        )

        await client.query("DELETE FROM user_pinned_projects_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_capstone_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_challenge_progress_projections WHERE enrollment_id = $1", [enrollmentId])
        await client.query("DELETE FROM user_course_progress_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_stats_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_xp_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_solved_challenges_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_coding_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_achievement_projections WHERE user_id = $1", [userId])
        await client.query("DELETE FROM user_contribution_projections WHERE user_id = $1", [userId])

        // The local UAT database intentionally has no ai_lab_eval_runs relation,
        // while the generic achievement recomputer evaluates every badge metric.
        // Materialize this fixture user's valid achievement view from its seeded
        // award ledger so the public profile query can read the UAT fixture
        // without widening the task into product-schema or business behavior work.
        const achievementProjection = (await client.query(
            `SELECT jsonb_build_object(
                'data', COALESCE(jsonb_agg(jsonb_build_object(
                    'slug', a.slug,
                    'name', a.name,
                    'description', a.description,
                    'iconKey', a.icon_key,
                    'criteriaType', a.criteria_type,
                    'threshold', a.threshold,
                    'earned', earned.earned_at IS NOT NULL,
                    'earnedAt', earned.earned_at,
                    'currentValue', CASE
                        WHEN earned.earned_at IS NULL THEN 0
                        WHEN earned.tier IS NOT NULL AND a.tier_thresholds IS NOT NULL
                            THEN COALESCE((a.tier_thresholds ->> (earned.tier - 1))::int, a.threshold)
                        ELSE a.threshold
                    END,
                    'tierReached', earned.tier,
                    'rarityPercent', CASE
                        WHEN earned.earned_at IS NULL THEN NULL
                        ELSE GREATEST(1, ROUND(COALESCE(holders.count, 0) / NULLIF(total.users, 0) * 100))::int
                    END
                ) ORDER BY a.sort_index, a.id), '[]'::jsonb),
                'count', COUNT(*) FILTER (WHERE earned.earned_at IS NOT NULL)
            ) AS value
            FROM achievements a
            CROSS JOIN (SELECT COUNT(*)::numeric AS users FROM users) total
            LEFT JOIN LATERAL (
                SELECT MIN(ua.earned_at) AS earned_at, MAX(ua.tier) AS tier
                FROM user_achievements ua
                WHERE ua.user_id = $1 AND ua.achievement_id = a.id
            ) earned ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(DISTINCT ua.user_id)::numeric AS count
                FROM user_achievements ua
                WHERE ua.achievement_id = a.id
            ) holders ON true`,
            [userId],
        )).rows[0]
        await client.query(
            `INSERT INTO user_achievement_projections (user_id, value, updated_at)
             VALUES ($1, $2::jsonb, now() + interval '4 hours')
             ON CONFLICT (user_id) DO UPDATE SET
                value = EXCLUDED.value,
                -- This isolated fixture cannot lazily recompute after the normal
                -- five-minute projection TTL: the local UAT schema deliberately
                -- omits the retired AI-Lab source relation. Keep only this seeded
                -- fixture snapshot fresh through the browser-lease window.
                updated_at = now() + interval '4 hours'`,
            [userId, JSON.stringify(achievementProjection.value)],
        )

        const verification = (await client.query(
            `SELECT
                (SELECT count(*)::int FROM user_pinned_projects WHERE user_id = $1) AS pins,
                (SELECT count(*)::int FROM user_pinned_projects
                 WHERE user_id = $1 AND type = 'external') AS external_pins,
                (SELECT count(*)::int FROM user_contents WHERE user_id = $1 AND is_read) AS lessons,
                (SELECT count(*)::int FROM user_challenge_submissions ucs
                 JOIN user_challenge_submission_attempts a ON a.user_challenge_submission_id = ucs.id
                 WHERE ucs.user_id = $1 AND a.score >= 80) AS passed_challenges,
                (SELECT count(DISTINCT coding_problem_id)::int FROM coding_submissions
                 WHERE user_id = $1 AND verdict = 'accepted') AS coding_solved,
                (SELECT count(*)::int FROM user_milestone_task_attempts a
                 JOIN user_milestone_tasks t ON t.id = a.user_milestone_task_id
                 WHERE t.enrollment_id = $2 AND a.passed) AS project_tasks,
                (SELECT count(DISTINCT mi.course_id)::int
                 FROM user_milestone_task_attempts a
                 JOIN user_milestone_tasks t ON t.id = a.user_milestone_task_id
                 JOIN milestone_tasks mt ON mt.id = t.milestone_task_id
                 JOIN milestones mi ON mi.id = mt.milestone_id
                 JOIN enrollments e ON e.id = t.enrollment_id
                 WHERE e.user_id = $1 AND a.passed) AS capstone_courses,
                (SELECT count(DISTINCT achievement_id)::int
                 FROM user_achievements WHERE user_id = $1) AS earned_achievements,
                (SELECT count(*)::int FROM user_achievement_projections WHERE user_id = $1)
                    AS achievement_projection_rows,
                (SELECT updated_at > now() FROM user_achievement_projections WHERE user_id = $1)
                    AS achievement_projection_is_fresh,
                (SELECT count(*)::int FROM activities
                 WHERE user_id = $1 AND idempotency_key LIKE 'profile:%') AS activities,
                (SELECT count(DISTINCT (created_at AT TIME ZONE 'Asia/Bangkok')::date)::int
                 FROM activities WHERE user_id = $1 AND idempotency_key LIKE 'profile:%') AS activity_days,
                (SELECT count(DISTINCT to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI'))::int
                 FROM activities WHERE user_id = $1 AND idempotency_key LIKE 'profile:%') AS activity_clock_times`,
            [userId, enrollmentId],
        )).rows[0]

        if (verification.pins < 2 || verification.external_pins < 1 || verification.lessons < 8
            || verification.passed_challenges < 3 || verification.coding_solved < 3
            || verification.project_tasks < 3 || verification.capstone_courses < 2
            || verification.earned_achievements < 3 || verification.achievement_projection_rows !== 1
            || !verification.achievement_projection_is_fresh || verification.activities !== 14
            || verification.activity_days !== 8 || verification.activity_clock_times !== 14) {
            throw new Error(`Profile seed verification failed: ${JSON.stringify(verification)}`)
        }

        await client.query("COMMIT")
        console.log(JSON.stringify({ username, course: profileResult.rows[0].title, ...verification }))
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
