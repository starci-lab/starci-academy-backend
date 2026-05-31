import pg from "pg"

const client = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "Cuong123_A",
    database: "starci-academy",
})

/** SCHEMA V2 — drop so TypeORM sync recreates legacy `{ locale, field, value }` shape. */
const V2_TABLES = [
    "challenge_requirement_v2_lang_translations",
    "challenge_step_v2_lang_translations",
    "challenge_output_v2_lang_translations",
    "challenge_prerequisite_v2_lang_translations",
    "challenge_requirement_v2_translations",
    "challenge_step_v2_translations",
    "challenge_output_v2_translations",
    "challenge_prerequisite_v2_translations",
    "challenge_requirement_v2_langs",
    "challenge_step_v2_langs",
    "challenge_output_v2_langs",
    "challenge_prerequisite_v2_langs",
    "challenge_requirements_v2",
    "challenge_steps_v2",
    "challenge_outputs_v2",
    "challenge_prerequisites_v2",
]

await client.connect()

for (const table of V2_TABLES) {
    await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)
    console.log("dropped:", table)
}

await client.end()
console.log("done")
