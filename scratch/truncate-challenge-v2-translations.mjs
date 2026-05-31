import pg from "pg"

/** All SCHEMA V2 translation tables (lang-level first is optional; no cross-FK between them). */
const V2_TRANSLATION_TABLES = [
    "challenge_requirement_v2_lang_translations",
    "challenge_step_v2_lang_translations",
    "challenge_output_v2_lang_translations",
    "challenge_prerequisite_v2_lang_translations",
    "challenge_requirement_v2_translations",
    "challenge_step_v2_translations",
    "challenge_output_v2_translations",
    "challenge_prerequisite_v2_translations",
]

const client = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "Cuong123_A",
    database: "starci-academy",
})

await client.connect()

console.log("Before TRUNCATE:")
for (const table of V2_TRANSLATION_TABLES) {
    const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
    console.log(`  ${table}: ${r.rows[0].n}`)
}

const tableList = V2_TRANSLATION_TABLES.join(", ")
await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`)

console.log("\nAfter TRUNCATE:")
for (const table of V2_TRANSLATION_TABLES) {
    const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
    console.log(`  ${table}: ${r.rows[0].n}`)
}

await client.end()
