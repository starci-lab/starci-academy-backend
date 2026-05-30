/*
 * Dev-only seed: gives user cuongnvtse160875 a mix of challenge progress
 * in the Fullstack Mastery course so the FE renders completed / in-progress states.
 * Idempotent: wipes this user's rows for the targeted submissions, then re-inserts.
 * Run: node scripts/seed-challenge-progress.cjs
 */
const fs = require("fs")
const { Client } = require("pg")
const Redis = require("ioredis")

const env = fs.readFileSync(".env.override", "utf8")
const get = (k) => {
    const m = env.match(new RegExp("^" + k + "=(.*)$", "m"))
    return m ? m[1].trim() : undefined
}

const USER_ID = "389702bd-24cb-47f1-9322-267be1ec63b9" // cuongnvtse160875@gmail.com
const ENROLLMENT_ID = "e8256be3-c90d-4a91-9a1f-50f2d5f7bdbc" // fullstack enrollment
const SUBMISSION_URL = "https://github.com/cuongnvtse/fullstack-mastery-payment-gateway"

// submission_id -> attempts (score per attempt). Last/highest matters for progress.
const PLAN = [
    {
        label: "Implement all 5 NestJS pipeline layers (20) — COMPLETED",
        submissionId: "3ed6c5c1-1a58-546c-8a6e-e96f2d936aa4",
        attempts: [12, 20],
        feedback: "Tất cả 5 layer pipeline hoạt động đúng thứ tự. Hoàn thành tốt.",
    },
    {
        label: "Multi-environment config + Winston (20) — COMPLETED",
        submissionId: "9fc634e8-a9aa-5227-9165-7401a71ba655",
        attempts: [20],
        feedback: "3 namespace config + Winston structured logging đạt yêu cầu.",
    },
    {
        label: "Custom Provider & Dynamic Module (40) — IN PROGRESS",
        submissionId: "4d9832b7-5044-5456-abbf-5a12b65cb883",
        attempts: [18, 28],
        feedback: "forRootAsync chạy ổn nhưng còn thiếu test cho custom provider token.",
    },
    {
        label: "Correlation-id propagation + masking (40) — IN PROGRESS",
        submissionId: "0c4abdd3-ee8a-5e7f-8e92-a6d191aec715",
        attempts: [15],
        feedback: "Correlation-id chưa propagate qua setTimeout boundary; cần AsyncLocalStorage.",
    },
    {
        label: "Cross-module DI OrderModule/InventoryModule (20) — COMPLETED w/ 3-attempt history",
        submissionId: "5fef20b8-6291-5b48-85bd-c13cabd2ea5d",
        attempts: [0, 12, 20],
        feedbacks: [
            "App không boot: Nest báo can't resolve InventoryService — OrderModule chưa import InventoryModule.",
            "Đã import InventoryModule nhưng InventoryModule chưa export InventoryService nên DI vẫn lỗi một phần.",
            "InventoryModule export InventoryService, OrderService inject qua constructor sạch, POST /orders đúng contract. Đạt.",
        ],
    },
    {
        // Empty attempts → userSubmission row created (URL pasted) but never submitted → "đang làm".
        label: "CRUD Article with Guards/Pipe/Interceptor (40) — IN PROGRESS (pasted URL, not submitted)",
        submissionId: "4890ed7f-2512-59cc-a68e-b3dfd6fc4396",
        attempts: [],
    },
]

;(async () => {
    const c = new Client({
        host: get("POSTGRESQL_PRIMARY_HOST"),
        port: +get("POSTGRESQL_PRIMARY_PORT"),
        user: get("POSTGRESQL_PRIMARY_USERNAME"),
        password: get("POSTGRESQL_PRIMARY_PASSWORD"),
        database: get("POSTGRESQL_PRIMARY_DATABASE"),
    })
    await c.connect()

    // Pick a valid locale enum label (prefer "vi").
    const localeRows = await c.query(
        "select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'locale'",
    )
    const labels = localeRows.rows.map((r) => r.enumlabel)
    const locale = labels.includes("vi") ? "vi" : labels[0]

    const submissionIds = PLAN.map((p) => p.submissionId)

    try {
        await c.query("BEGIN")

        // Idempotency: remove prior rows for this user + targeted submissions
        // (attempts cascade-delete via FK).
        await c.query(
            "delete from user_challenge_submissions where user_id = $1 and submission_id = ANY($2)",
            [USER_ID, submissionIds],
        )

        for (const item of PLAN) {
            const ucs = await c.query(
                `insert into user_challenge_submissions (user_id, submission_id, submission_url)
                 values ($1, $2, $3) returning id`,
                [USER_ID, item.submissionId, SUBMISSION_URL],
            )
            const ucsId = ucs.rows[0].id

            for (let i = 0; i < item.attempts.length; i++) {
                // Per-attempt feedback when provided, else the shared one.
                const shortFeedback = item.feedbacks?.[i] ?? item.feedback
                // Stagger processed_at so older attempts sit earlier in the history timeline.
                const hoursAgo = (item.attempts.length - i) * 24
                await c.query(
                    `insert into user_challenge_submission_attempts
                       (attempt_number, score, short_feedback, processed_at, default_locale,
                        user_challenge_submission_id, submission_url)
                     values ($1, $2, $3, now() - make_interval(hours => $4), $5, $6, $7)`,
                    [
                        i + 1,
                        item.attempts[i],
                        shortFeedback,
                        hoursAgo,
                        locale,
                        ucsId,
                        SUBMISSION_URL,
                    ],
                )
            }
            const max = item.attempts.length ? Math.max(...item.attempts) : "—"
            console.log(`  ✓ ${item.label} | attempts=[${item.attempts}] latest=${item.attempts.at(-1) ?? "—"} max=${max}`)
        }

        await c.query("COMMIT")
        console.log(`\nSeeded ${PLAN.length} challenge submissions for user ${USER_ID} (locale=${locale}).`)
    } catch (e) {
        await c.query("ROLLBACK")
        console.error("ROLLBACK:", e.message)
        process.exitCode = 1
    } finally {
        await c.end()
    }

    // Flush stale Redis cache so getProgress recomputes from DB.
    try {
        const redis = new Redis({
            host: get("REDIS_CACHE_HOST"),
            port: +get("REDIS_CACHE_PORT"),
            password: get("REDIS_CACHE_PASSWORD"),
            lazyConnect: true,
        })
        await redis.connect()
        const key = `challenge.submission.progress:${ENROLLMENT_ID}`
        const direct = await redis.del(key)
        const pattern = await redis.keys("challenge.submission.progress*")
        if (pattern.length) await redis.del(...pattern)
        console.log(`Redis: cleared key "${key}" (del=${direct}), +${pattern.length} pattern keys.`)
        await redis.quit()
    } catch (e) {
        console.error("Redis flush skipped:", e.message)
    }
})()
