/**
 * Removes everything lb-seed.cjs created:
 *   - mock users (keycloak_id LIKE 'mock-lb-%') — cascades their enrollments,
 *     challenge submissions, attempts and content reads.
 *   - the teacher's seeded rows: challenge submissions with the mock URL marker
 *     (cascades attempts), plus their enrollment + lesson reads in this course.
 * Then clears the Redis leaderboard cache so the board recomputes back to empty.
 */
const { Client } = require("pg")
const Redis = require("ioredis")

const COURSE_DISPLAY_ID = "fullstack-mastery"
const SUBMISSION_URL_PREFIX = "https://github.com/starci-mock"

const pg = new Client({ host: "localhost", port: 5433, user: "postgres", password: "Cuong123_A", database: "starci-academy" })

async function main() {
    await pg.connect()
    const course = await pg.query("SELECT id FROM courses WHERE display_id = $1", [COURSE_DISPLAY_ID])
    const courseId = course.rows[0]?.id

    await pg.query("BEGIN")
    try {
        // mock users → cascade removes their enrollments/submissions/attempts/reads
        const delUsers = await pg.query("DELETE FROM users WHERE keycloak_id LIKE 'mock-lb-%' RETURNING id")

        // teacher's seeded submissions (cascade removes their attempts)
        const delSubs = await pg.query(
            "DELETE FROM user_challenge_submissions WHERE submission_url LIKE $1 RETURNING id",
            [`${SUBMISSION_URL_PREFIX}/%`],
        )

        if (courseId) {
            // teacher's seeded lesson reads in this course
            await pg.query(
                `DELETE FROM user_contents uc USING contents ct, modules m
                 WHERE uc.content_id = ct.id AND ct.module_id = m.id AND m.course_id = $1`,
                [courseId],
            )
            // remaining enrollments left behind by the teacher seed
            await pg.query("DELETE FROM enrollments WHERE course_id = $1", [courseId])
        }
        await pg.query("COMMIT")
        console.log(`Removed ${delUsers.rowCount} mock user(s), ${delSubs.rowCount} teacher seeded submission(s).`)
    } catch (e) {
        await pg.query("ROLLBACK")
        throw e
    }

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
    console.log(`Cleared ${keys.length} redis key(s).`)
    await pg.end()
}

main().catch((e) => { console.error("UNSEED ERROR:", e); process.exit(1) })
