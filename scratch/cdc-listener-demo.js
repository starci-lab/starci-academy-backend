// E2E demo of the CDC projector listener:
//   push a FAKE Debezium-shaped message into the Kafka CDC topic, a real KafkaJS
//   consumer (the "listener") picks it up → derives (user, course) → recomputes
//   the progress projection → we verify the projection row was written.
//
// Run: node scratch/cdc-listener-demo.js   (Kafka on localhost:29092, PG on 5433)

const { Kafka } = require("kafkajs")
const { Client } = require("pg")

const TOPIC = "starci.public.user_contents"
const PG = { host: "localhost", port: 5433, user: "postgres", password: "Cuong123_A", database: "starci-academy" }

// the projector's single-user recompute (same logic as ProgressProjectionService)
const RECOMPUTE_SQL = `
INSERT INTO user_course_progress_projections
  (user_id, course_id, total_score, completed_challenges, lessons_read, milestone_progress, total_xp)
WITH per_submission_max AS (
  SELECT ucs.user_id, cs.challenge_id, cs.id AS submission_id, COALESCE(MAX(a.score),0) AS max_score
  FROM user_challenge_submissions ucs
  JOIN challenge_submissions cs ON cs.id=ucs.submission_id
  LEFT JOIN user_challenge_submission_attempts a ON a.user_challenge_submission_id=ucs.id
  WHERE cs.challenge_id IN (SELECT c.id FROM challenges c JOIN contents ct ON ct.id=c.content_id JOIN modules m ON m.id=ct.module_id WHERE m.course_id=$1)
  GROUP BY ucs.user_id, cs.challenge_id, cs.id),
per_challenge AS (SELECT user_id, challenge_id, SUM(max_score) AS sc FROM per_submission_max GROUP BY user_id, challenge_id),
per_user AS (SELECT pc.user_id, SUM(pc.sc)::bigint AS total_score, SUM(CASE WHEN pc.sc>=c.score AND c.score>0 THEN 1 ELSE 0 END)::bigint AS completed FROM per_challenge pc JOIN challenges c ON c.id=pc.challenge_id GROUP BY pc.user_id),
read_per_user AS (SELECT uc.user_id, COUNT(*)::bigint AS lessons FROM user_contents uc JOIN contents ct ON ct.id=uc.content_id JOIN modules m ON m.id=ct.module_id WHERE m.course_id=$1 AND uc.is_read=true GROUP BY uc.user_id),
milestone_per_user AS (SELECT e.user_id, COUNT(DISTINCT umt.id)::bigint AS ms FROM enrollments e JOIN user_milestone_tasks umt ON umt.enrollment_id=e.id JOIN user_milestone_task_attempts umta ON umta.user_milestone_task_id=umt.id AND umta.passed=true WHERE e.course_id=$1 GROUP BY e.user_id)
SELECT e.user_id, e.course_id,
  COALESCE(pu.total_score,0)::int, COALESCE(pu.completed,0)::int, COALESCE(rpu.lessons,0)::int, COALESCE(mpu.ms,0)::int,
  (COALESCE(pu.total_score,0)+COALESCE(rpu.lessons,0)*3+COALESCE(mpu.ms,0)*10)::int
FROM enrollments e
LEFT JOIN per_user pu ON pu.user_id=e.user_id
LEFT JOIN read_per_user rpu ON rpu.user_id=e.user_id
LEFT JOIN milestone_per_user mpu ON mpu.user_id=e.user_id
WHERE e.course_id=$1 AND e.user_id=$2
ON CONFLICT (user_id, course_id) DO UPDATE SET
  total_score=EXCLUDED.total_score, completed_challenges=EXCLUDED.completed_challenges,
  lessons_read=EXCLUDED.lessons_read, milestone_progress=EXCLUDED.milestone_progress,
  total_xp=EXCLUDED.total_xp, updated_at=now()`

const main = async () => {
    const pg = new Client(PG)
    await pg.connect()

    // pick a real (user, content) where the user is enrolled in the content's course
    const seed = (await pg.query(`
        SELECT e.user_id, ct.id AS content_id, e.course_id
        FROM enrollments e
        JOIN modules m   ON m.course_id = e.course_id
        JOIN contents ct ON ct.module_id = m.id
        LIMIT 1`)).rows[0]
    if (!seed) { console.log("no enrollment+content to demo with"); await pg.end(); return }
    console.log("seed: user=%s content=%s course=%s", seed.user_id, seed.content_id, seed.course_id)

    const kafka = new Kafka({ clientId: "cdc-demo", brokers: ["localhost:29092"] })
    const consumer = kafka.consumer({ groupId: "cdc-demo-" + Date.now() })
    await consumer.connect()
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false })

    let done
    const processed = new Promise((r) => { done = r })

    await consumer.run({
        eachMessage: async ({ message }) => {
            const raw = JSON.parse(message.value.toString())
            const row = raw.payload ?? raw   // unwrap Debezium envelope
            console.log("LISTENER got message → user_id=%s content_id=%s is_read=%s", row.user_id, row.content_id, row.is_read)
            // derive courseId from the content (dashboard has no course context)
            const c = (await pg.query("SELECT m.course_id FROM contents ct JOIN modules m ON m.id=ct.module_id WHERE ct.id=$1", [row.content_id])).rows[0]
            if (!c) { console.log("  (content not found, skip)"); return }
            // recompute the projection for (user, course)
            await pg.query(RECOMPUTE_SQL, [c.course_id, row.user_id])
            const proj = (await pg.query("SELECT total_xp, lessons_read, completed_challenges FROM user_course_progress_projections WHERE user_id=$1 AND course_id=$2", [row.user_id, c.course_id])).rows[0]
            console.log("  → recomputed projection:", JSON.stringify(proj))
            done()
        },
    })

    // give the consumer a moment to join, then PUSH the fake CDC message
    await new Promise((r) => setTimeout(r, 4000))
    const producer = kafka.producer()
    await producer.connect()
    const fake = { payload: { user_id: seed.user_id, content_id: seed.content_id, is_read: true, is_favorite: false } }
    await producer.send({ topic: TOPIC, messages: [{ value: JSON.stringify(fake) }] })
    console.log("PUSHED fake CDC message to", TOPIC)

    await Promise.race([processed, new Promise((r) => setTimeout(r, 15000))])
    await producer.disconnect()
    await consumer.disconnect()
    await pg.end()
    console.log("DONE")
    process.exit(0)
}

main().catch((e) => { console.error("ERR", e.message); process.exit(1) })
