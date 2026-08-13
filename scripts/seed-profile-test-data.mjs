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
    pin: "7ed00000-0000-4000-8000-000000000001",
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
    ],
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

        if (contents.length < 8 || challenges.length < 3 || codingProblems.length < 3 || milestoneTasks.length < 3) {
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
            [ids.pin, userId, enrollmentId],
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
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    user_id = EXCLUDED.user_id, payload = EXCLUDED.payload,
                    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:lesson:${index}`,
                    JSON.stringify({ target: { entityName: "ContentEntity", id: content.id, label: content.title } }),
                    7 - index],
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
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    payload = EXCLUDED.payload, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:challenge:${index}`,
                    JSON.stringify({ target: { entityName: "ChallengeEntity", id: challenge.challenge_id, label: challenge.title } }),
                    5 - index],
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
                         now() - ($4 * interval '1 day'), now() - ($4 * interval '1 day'))
                 ON CONFLICT (type, idempotency_key) DO UPDATE SET
                    payload = EXCLUDED.payload, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
                [userId, `${seedKey}:coding:${index}`,
                    JSON.stringify({ target: { entityName: "CodingProblemEntity", id: problem.id, label: problem.title } }),
                    4 - index],
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
            if (index < 2) {
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

        const verification = (await client.query(
            `SELECT
                (SELECT count(*)::int FROM user_pinned_projects WHERE user_id = $1) AS pins,
                (SELECT count(*)::int FROM user_contents WHERE user_id = $1 AND is_read) AS lessons,
                (SELECT count(*)::int FROM user_challenge_submissions ucs
                 JOIN user_challenge_submission_attempts a ON a.user_challenge_submission_id = ucs.id
                 WHERE ucs.user_id = $1 AND a.score >= 80) AS passed_challenges,
                (SELECT count(DISTINCT coding_problem_id)::int FROM coding_submissions
                 WHERE user_id = $1 AND verdict = 'accepted') AS coding_solved,
                (SELECT count(*)::int FROM user_milestone_task_attempts a
                 JOIN user_milestone_tasks t ON t.id = a.user_milestone_task_id
                 WHERE t.enrollment_id = $2 AND a.passed) AS project_tasks,
                (SELECT count(*)::int FROM activities
                 WHERE user_id = $1 AND idempotency_key LIKE 'profile:%') AS activities`,
            [userId, enrollmentId],
        )).rows[0]

        if (verification.pins < 1 || verification.lessons < 8 || verification.passed_challenges < 3
            || verification.coding_solved < 3 || verification.project_tasks < 2 || verification.activities < 14) {
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
