/**
 * One-off: seed a realistic leaderboard for the Fullstack Mastery course so the
 * board renders with data. Inserts mock users + enrollments + scored challenge
 * submissions + lesson reads through the REAL tables the leaderboard query reads,
 * then clears the Redis leaderboard cache so the next read recomputes from DB.
 *
 * Everything seeded is tagged for easy removal:
 *   - mock users:        users.keycloak_id LIKE 'mock-lb-%'
 *   - seeded submissions: user_challenge_submissions.submission_url LIKE 'https://github.com/starci-mock/%'
 * Run lb-unseed.cjs to remove it all.
 */
const { Client } = require("pg")
const Redis = require("ioredis")

const COURSE_DISPLAY_ID = "fullstack-mastery"
const SUBMISSION_URL_PREFIX = "https://github.com/starci-mock"

// (display name, challenges-to-complete, lessons-to-read). null userId => create a mock user;
// a fixed userId targets an existing real user (the teacher) so their own rank shows.
const PLAN = [
    { name: "Minh Anh", challenges: 10, reads: 5 },
    { name: "Quang Huy", challenges: 9, reads: 5 },
    { name: "Bảo Trân", challenges: 7, reads: 5 },
    { name: "__TEACHER__", challenges: 6, reads: 5 },
    { name: "Đức Anh", challenges: 4, reads: 4 },
    { name: "Thu Hà", challenges: 3, reads: 3 },
    { name: "Gia Bảo", challenges: 2, reads: 2 },
    { name: "Lan Chi", challenges: 0, reads: 5 },
]

const pg = new Client({ host: "localhost", port: 5433, user: "postgres", password: "Cuong123_A", database: "starci-academy" })

async function main() {
    await pg.connect()

    const course = await pg.query("SELECT id FROM courses WHERE display_id = $1", [COURSE_DISPLAY_ID])
    if (!course.rows.length) throw new Error(`course ${COURSE_DISPLAY_ID} not found`)
    const courseId = course.rows[0].id

    // the logged-in teacher = the single real user; enrolled so MyRankCard shows a real rank
    const teacher = await pg.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")
    const teacherId = teacher.rows[0].id

    // challenge submissions (one per challenge here) + their challenge score, in order
    const subs = await pg.query(
        `SELECT cs.id AS submission_id, cs.challenge_id, ch.score AS challenge_score
         FROM challenge_submissions cs
         JOIN challenges ch ON ch.id = cs.challenge_id
         JOIN contents ct ON ct.id = ch.content_id
         JOIN modules m ON m.id = ct.module_id
         WHERE m.course_id = $1
         ORDER BY ch.order_index, cs.order_index`,
        [courseId],
    )
    const contents = await pg.query(
        `SELECT ct.id FROM contents ct
         JOIN modules m ON m.id = ct.module_id
         WHERE m.course_id = $1
         ORDER BY m.order_index, ct.order_index`,
        [courseId],
    )
    if (!subs.rows.length || !contents.rows.length) throw new Error("course has no challenge submissions / contents to seed against")

    await pg.query("BEGIN")
    try {
        let idx = 0
        for (const p of PLAN) {
            idx++
            let userId
            if (p.name === "__TEACHER__") {
                userId = teacherId
            } else {
                const slug = `mock-lb-${idx}`
                const inserted = await pg.query(
                    `INSERT INTO users (username, email, keycloak_id, avatar, authentication_type)
                     VALUES ($1, $2, $3, $4, 'google')
                     ON CONFLICT (keycloak_id) DO UPDATE SET username = EXCLUDED.username
                     RETURNING id`,
                    [p.name, `${slug}@starci.local`, slug, `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(p.name)}`],
                )
                userId = inserted.rows[0].id
            }

            // enroll (idempotent) — base row the leaderboard ranks from
            await pg.query(
                `INSERT INTO enrollments (user_id, course_id, pricing_phase)
                 VALUES ($1, $2, 'regular')
                 ON CONFLICT (user_id, course_id) DO NOTHING`,
                [userId, courseId],
            )

            // scored challenge submissions → challenge XP (one passing attempt each)
            for (let i = 0; i < p.challenges && i < subs.rows.length; i++) {
                const s = subs.rows[i]
                const url = `${SUBMISSION_URL_PREFIX}/${userId}/challenge-${i + 1}`
                const ucs = await pg.query(
                    `INSERT INTO user_challenge_submissions (user_id, submission_id, submission_url)
                     VALUES ($1, $2, $3) RETURNING id`,
                    [userId, s.submission_id, url],
                )
                await pg.query(
                    `INSERT INTO user_challenge_submission_attempts
                       (attempt_number, score, short_feedback, processed_at, submission_url, user_challenge_submission_id, default_locale)
                     VALUES (1, $1, 'Seeded passing attempt.', NOW(), $2, $3, 'vi')`,
                    [s.challenge_score, url, ucs.rows[0].id],
                )
            }

            // lesson reads → +3 XP each
            for (let i = 0; i < p.reads && i < contents.rows.length; i++) {
                await pg.query(
                    `INSERT INTO user_contents (user_id, content_id, is_read)
                     VALUES ($1, $2, true)
                     ON CONFLICT (user_id, content_id) DO UPDATE SET is_read = true`,
                    [userId, contents.rows[i].id],
                )
            }
        }
        await pg.query("COMMIT")
    } catch (e) {
        await pg.query("ROLLBACK")
        throw e
    }

    // clear cached (empty) leaderboard so the next read recomputes from the seeded DB
    const redis = new Redis({ host: "localhost", port: 6380, password: "Cuong123_A" })
    const keys = []
    let cursor = "0"
    do {
        const [next, batch] = await redis.scan(cursor, "MATCH", "*leaderboard*", "COUNT", 200)
        cursor = next
        keys.push(...batch)
    } while (cursor !== "0")
    if (keys.length) await redis.del(...keys)
    await redis.quit()

    console.log(`SEEDED course ${courseId}: ${PLAN.length} participants. Cleared ${keys.length} redis key(s):`, keys)
    await pg.end()
}

main().catch((e) => { console.error("SEED ERROR:", e); process.exit(1) })
