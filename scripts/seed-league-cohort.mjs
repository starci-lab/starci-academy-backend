/**
 * Put the demo learners into the viewer's CURRENT weekly cohort, with points inside this week.
 *
 * WHY A SEPARATE SCRIPT. `seed-dashboard-test-data.mjs` creates the demo learners and their coin
 * balances, which is what the GLOBAL board reads. The weekly board reads something else entirely:
 * membership of one `league_cohorts` row, and `xp_histories` dated inside that cohort's week
 * window. Seeding one has never seeded the other, which is why the weekly board showed a cohort of
 * one while the global board showed eleven people.
 *
 *   node --env-file-if-exists=.env.override scripts/seed-league-cohort.mjs [email]
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

/** Week points per demo learner, spread so the dais and the rows below it are both populated. */
const WEEK_POINTS = [180, 165, 150, 130, 115, 95, 80, 65, 45, 25]

/**
 * Where each learner finished LAST week.
 *
 * `rankDelta` is `last_week_rank - rank`, so a board with no baseline reports "no movement" for
 * everybody and every row draws the neutral dash - which is what a freshly seeded week looks like
 * and reads as a broken feature. These are deliberately shuffled against this week's order so the
 * board shows climbs, drops and genuine non-movers, and one learner is left null on purpose to
 * keep the "no baseline" case visible.
 */
const LAST_WEEK_RANK = [4, 2, 7, 3, 5, 1, 9, 6, null, 10]

await client.connect()

try {
    const viewer = await client.query(
        "SELECT id, username FROM users WHERE email = $1 OR username = $1 LIMIT 1",
        [TEST_EMAIL],
    )
    if (viewer.rowCount === 0) throw new Error(`no user matches ${TEST_EMAIL}`)
    const viewerId = viewer.rows[0].id

    // The cohort the viewer is already in decides the week window; inventing a second cohort would
    // leave them racing nobody while the seeded learners raced each other.
    const membership = await client.query(
        `SELECT c.id, c.tier, c.week_start_at, c.week_end_at
           FROM user_leagues ul
           JOIN league_cohorts c ON c.id = ul.cohort_id
          WHERE ul.user_id = $1`,
        [viewerId],
    )

    let cohort = membership.rows[0]
    if (cohort === undefined) {
        const created = await client.query(
            `INSERT INTO league_cohorts (tier, week_start_at, week_end_at)
             VALUES ('bronze', date_trunc('week', now()), date_trunc('week', now()) + interval '7 days')
             RETURNING id, tier, week_start_at, week_end_at`,
        )
        cohort = created.rows[0]
        await client.query(
            `INSERT INTO user_leagues (user_id, tier, cohort_id, joined_week_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET cohort_id = EXCLUDED.cohort_id, tier = EXCLUDED.tier`,
            [viewerId, cohort.tier, cohort.id, cohort.week_start_at],
        )
        console.log(`created cohort ${cohort.id} and placed ${TEST_EMAIL} in it`)
    }

    const course = await client.query("SELECT id FROM courses LIMIT 1")
    const courseId = course.rows[0]?.id ?? null

    const learners = await client.query(
        "SELECT id, username FROM users WHERE username LIKE 'starci.demo.%' ORDER BY username",
    )
    if (learners.rowCount === 0) {
        throw new Error("no demo learners found - run seed:dashboard-test-data first")
    }

    let placed = 0
    for (const [index, learner] of learners.rows.entries()) {
        await client.query(
            `INSERT INTO user_leagues (user_id, tier, cohort_id, joined_week_at, last_week_rank)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id) DO UPDATE SET
                 cohort_id = EXCLUDED.cohort_id,
                 tier = EXCLUDED.tier,
                 last_week_rank = EXCLUDED.last_week_rank`,
            [learner.id, cohort.tier, cohort.id, cohort.week_start_at, LAST_WEEK_RANK[index % LAST_WEEK_RANK.length]],
        )

        // Re-runnable: the same ref_id is one learner's seeded week, replaced rather than stacked.
        // It carries the learner and not the cohort because `ref_id` is varchar(64) and two uuids
        // do not fit - and the learner is the half that makes the row unique anyway.
        const refId = `seed:league:${learner.id}`
        await client.query("DELETE FROM xp_histories WHERE ref_id = $1", [refId])
        await client.query(
            `INSERT INTO xp_histories
                (user_id, course_id, source, amount, points, ref_id, created_at, updated_at)
             VALUES ($1, $2, 'lessonRead', $3, $3, $4,
                     $5::timestamptz + interval '1 hour', now())`,
            [learner.id, courseId, WEEK_POINTS[index % WEEK_POINTS.length], refId, cohort.week_start_at],
        )
        placed += 1
    }

    /*
     * The weekly board does NOT read the rows this script just wrote.
     *
     * It reads `league_cohort_points_projections`, a flat per-cohort snapshot kept fresh by CDC on
     * `xp_histories` with a TTL lazy-refresh as the fallback. Locally there is no CDC pipeline, so a
     * seeded week stays invisible until the TTL happens to expire - which is exactly what "I seeded
     * ten learners and the board still shows one" looks like. Dropping the row makes the next read
     * rebuild it from the source tables instead of waiting.
     */
    const dropped = await client.query(
        "DELETE FROM league_cohort_points_projections WHERE cohort_id = $1",
        [cohort.id],
    )
    console.log(`projection rows dropped: ${dropped.rowCount} (next read rebuilds from source)`)

    const standing = await client.query(
        `SELECT u.username, COALESCE(SUM(x.points), 0)::int AS week_points
           FROM user_leagues ul
           JOIN users u ON u.id = ul.user_id
           LEFT JOIN xp_histories x
                  ON x.user_id = ul.user_id
                 AND x.created_at >= $2 AND x.created_at < $3
          WHERE ul.cohort_id = $1
          GROUP BY u.username
          ORDER BY week_points DESC`,
        [cohort.id, cohort.week_start_at, cohort.week_end_at],
    )

    console.log(`cohort ${cohort.id} (${cohort.tier}) — ${placed} demo learners placed`)
    console.log(`week window ${cohort.week_start_at.toISOString()} .. ${cohort.week_end_at.toISOString()}`)
    for (const row of standing.rows) console.log(`  ${String(row.week_points).padStart(4)} XP  ${row.username}`)
} finally {
    await client.end()
}
