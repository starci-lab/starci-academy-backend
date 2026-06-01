import pg from "pg"

/**
 * Truncate SCHEMA V2 per-programming-language rows + their translation tables.
 * Safe order: lang translations → langs (single TRUNCATE … CASCADE covers FK chain).
 */
const V2_LANG_TABLES = [
    "challenge_requirement_v2_lang_translations",
    "challenge_step_v2_lang_translations",
    "challenge_output_v2_lang_translations",
    "challenge_prerequisite_v2_lang_translations",
    "challenge_requirement_v2_langs",
    "challenge_step_v2_langs",
    "challenge_output_v2_langs",
    "challenge_prerequisite_v2_langs",
]

const client = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "Cuong123_A",
    database: "starci-academy",
})

await client.connect()

const count = async (table) => {
    const r = await client.query(`SELECT COUNT(*)::int AS n FROM "${table}"`)
    return r.rows[0].n
}

console.log("Before TRUNCATE:")
for (const table of V2_LANG_TABLES) {
    console.log(`  ${table}: ${await count(table)}`)
}

await client.query(`TRUNCATE TABLE ${V2_LANG_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`)

console.log("\nAfter TRUNCATE:")
for (const table of V2_LANG_TABLES) {
    console.log(`  ${table}: ${await count(table)}`)
}

await client.end()
console.log("\ndone")
