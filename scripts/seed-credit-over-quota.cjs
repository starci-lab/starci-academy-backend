/*
 * Dev-only seed: simulates 5 free Auto gradings done ~1 hour ago, pushing user
 * cuongnvtse160875 OVER the credit quota (50) so the next grading FAILS.
 * Source of truth = credit_usage_histories (5 × auto/10 credits = 50 >= 50).
 * Idempotent: wipes this user's history rows first, then re-inserts.
 * Each row links to one of the user's existing attempts (FK is required).
 * Run: node scripts/seed-credit-over-quota.cjs
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
const CREDIT_QUOTA = 50
const AUTO_CREDITS = 10
const AUTO_COUNT = 5 // 5 × 10 = 50 → reaches the quota

;(async () => {
    const c = new Client({
        host: get("POSTGRESQL_PRIMARY_HOST"),
        port: +get("POSTGRESQL_PRIMARY_PORT"),
        user: get("POSTGRESQL_PRIMARY_USERNAME"),
        password: get("POSTGRESQL_PRIMARY_PASSWORD"),
        database: get("POSTGRESQL_PRIMARY_DATABASE"),
    })
    await c.connect()

    // Existing attempts of this user — each history row needs one (FK required).
    const attempts = await c.query(
        `select a.id
         from user_challenge_submission_attempts a
         join user_challenge_submissions ucs on ucs.id = a.user_challenge_submission_id
         where ucs.user_id = $1
         order by a.created_at`,
        [USER_ID],
    )
    if (attempts.rows.length === 0) {
        console.error("No attempts found for the user — run seed-challenge-progress.cjs first.")
        await c.end()
        process.exitCode = 1
        return
    }
    const attemptIds = attempts.rows.map((r) => r.id)

    try {
        await c.query("BEGIN")
        await c.query(
            "delete from credit_usage_histories where user_id = $1",
            [USER_ID],
        )
        let total = 0
        for (let i = 0; i < AUTO_COUNT; i++) {
            const attemptId = attemptIds[i % attemptIds.length]
            // Stamp ~1 hour ago, staggered a few minutes apart for realism.
            await c.query(
                `insert into credit_usage_histories
                   (user_id, user_challenge_submission_attempt_id, mode, recommendation, credits,
                    created_at, updated_at)
                 values ($1, $2, 'auto', null, $3,
                    now() - make_interval(mins => 60 + $4), now() - make_interval(mins => 60 + $4))`,
                [USER_ID, attemptId, AUTO_CREDITS, i * 2],
            )
            total += AUTO_CREDITS
            console.log(`  + auto = ${AUTO_CREDITS} credits (~${60 + i * 2} mins ago)`)
        }
        await c.query("COMMIT")
        console.log(`\nSeeded ${AUTO_COUNT} auto charges = ${total} credits used (quota ${CREDIT_QUOTA}) → overQuota=${total >= CREDIT_QUOTA}.`)
    } catch (e) {
        await c.query("ROLLBACK")
        console.error("ROLLBACK:", e.message)
        process.exitCode = 1
    } finally {
        await c.end()
    }

    // Flush the cached credit total so the next read recomputes from the table.
    try {
        const redis = new Redis({
            host: get("REDIS_CACHE_HOST"),
            port: +get("REDIS_CACHE_PORT"),
            password: get("REDIS_CACHE_PASSWORD"),
            lazyConnect: true,
        })
        await redis.connect()
        const key = `credit.usage:${USER_ID}`
        const direct = await redis.del(key)
        const pattern = await redis.keys("credit.usage*")
        if (pattern.length) await redis.del(...pattern)
        console.log(`Redis: cleared key "${key}" (del=${direct}), +${pattern.length} pattern keys.`)
        await redis.quit()
    } catch (e) {
        console.error("Redis flush skipped:", e.message)
    }
})()
