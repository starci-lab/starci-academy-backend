import pg from "pg"

const client = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "Cuong123_A",
    database: "starci-academy",
})

/** SCHEMA V2 — translations → langs → items (truncate together). */
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

/** Must clear before `challenges` (FK from submissions / translations / legacy). */
const CHALLENGE_CHILDREN_BEFORE_ROOT = [
    "challenge_submission_outcome_criteria_langs",
    "challenge_submission_approach_criteria_langs",
    "challenge_submission_outcome_criteria",
    "challenge_submission_approach_criteria",
    "challenge_submission_prompt_translations",
    "challenge_submission_prompts",
    "challenge_submission_translations",
    "challenge_submissions",
    "challenge_translations",
    "challenge_reference_translations",
    "challenge_references",
    "challenge_requirement_translations",
    "challenge_requirements",
    "challenge_step_code_implementation_translations",
    "challenge_step_code_implementations",
    "challenge_step_translations",
    "challenge_steps",
    "challenge_output_translations",
    "challenge_outputs",
    "challenge_prerequisite_translations",
    "challenge_prerequisites",
]

await client.connect()

const count = async (table) => {
    const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
    return r.rows[0].n
}

console.log("challenges before:", await count("challenges"))

const v2List = V2_TABLES.join(", ")
await client.query(`TRUNCATE TABLE ${v2List} RESTART IDENTITY CASCADE`)
console.log("Truncated all *_v2* tables.")

const childList = CHALLENGE_CHILDREN_BEFORE_ROOT.join(", ")
await client.query(`TRUNCATE TABLE ${childList} RESTART IDENTITY CASCADE`)
console.log("Truncated challenge children (submissions, legacy, translations, …).")

await client.query("TRUNCATE TABLE challenges RESTART IDENTITY CASCADE")
console.log("Truncated challenges.")

console.log("challenges after:", await count("challenges"))
for (const table of ["challenge_steps_v2", "challenge_step_v2_langs", "challenge_step_v2_lang_translations"]) {
    console.log(`${table} after:`, await count(table))
}

await client.end()
