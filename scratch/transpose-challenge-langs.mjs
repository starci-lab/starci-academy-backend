// Transpose challenge V2 lang sections from OLD layout (bucket = programming language)
// to NEW layout (bucket = item index; each langs[] item carries its own `##### lang`).
//
// OLD:                                  NEW:
// ## 0                                  ## 0                (item 0)
// ### lang  -> typescript               ### langs
// ### langs                             #### 0
// #### 0  (item 0) title/body/score     ##### lang -> typescript
// #### 1  (item 1) ...                  ##### title/body/score   (item 0, ts)
// ## 1                                  #### 1
// ### lang  -> java                     ##### lang -> java
// ### langs ...                         ##### title/body/score   (item 0, java)
//                                       ...
//                                       ## 1                (item 1) ...
//
// Only the 4 lang-bucket sections are transformed; all other top-level
// sections (title/description/difficulty/score/verified) pass through byte-identical.

import { readFileSync, writeFileSync } from "node:fs"

const SEP = "<!-- @starci/seperator -->"
const LANG_SECTIONS = new Set(["requirements", "steps", "outputs", "prerequisites"])

const files = process.argv.slice(2)
if (files.length === 0) {
    console.error("usage: node transpose-challenge-langs.mjs <file...>")
    process.exit(1)
}

/** Read a separator-wrapped value starting at lines[i] === SEP. Returns {value, next}. */
function readSepValue(lines, i) {
    // lines[i] must be SEP (opening)
    if (lines[i] !== SEP) {
        throw new Error(`expected SEP at line ${i}, got: ${JSON.stringify(lines[i])}`)
    }
    const body = []
    let j = i + 1
    while (j < lines.length && lines[j] !== SEP) {
        body.push(lines[j])
        j++
    }
    if (j >= lines.length) {
        throw new Error(`unterminated SEP block opened at line ${i}`)
    }
    // j points at closing SEP
    return { value: body.join("\n"), next: j + 1 }
}

/** Parse one lang section's lines (between this `# x` and the next `# y`) into buckets. */
function parseLangSection(lines) {
    const buckets = []
    let cur = null
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        if (/^## \d+$/.test(line)) {
            cur = { lang: null, items: [] }
            buckets.push(cur)
            i++
            continue
        }
        if (line === "### lang") {
            const { value, next } = readSepValue(lines, i + 1)
            cur.lang = value.trim()
            i = next
            continue
        }
        if (line === "### langs") {
            i++
            continue
        }
        if (/^#### \d+$/.test(line)) {
            cur.items.push({ orderIndex: Number(line.slice(5)), fields: {} })
            i++
            continue
        }
        if (/^##### \w+$/.test(line)) {
            const field = line.slice(6).trim()
            const { value, next } = readSepValue(lines, i + 1)
            cur.items[cur.items.length - 1].fields[field] = value
            i = next
            continue
        }
        // blank lines / stray content between blocks — skip
        i++
    }
    return buckets
}

/** Emit a field block: heading + SEP-wrapped value. */
function emitField(out, level, name, value) {
    out.push(`${"#".repeat(level)} ${name}`)
    out.push(SEP)
    out.push(value)
    out.push(SEP)
}

/** Build the transposed NEW-layout lines for a section (no leading `# section`). */
function emitTransposed(buckets) {
    // field order to preserve when present
    const FIELD_ORDER = ["title", "body", "score"]
    // union of item orderIndexes across buckets, sorted
    const itemIndexes = [...new Set(buckets.flatMap((b) => b.items.map((it) => it.orderIndex)))]
        .sort((a, b) => a - b)
    const out = []
    for (const itemIndex of itemIndexes) {
        out.push(`## ${itemIndex}`)
        out.push("### langs")
        buckets.forEach((bucket, langIdx) => {
            const item = bucket.items.find((it) => it.orderIndex === itemIndex)
            out.push(`#### ${langIdx}`)
            emitField(out, 5, "lang", bucket.lang)
            if (item) {
                for (const f of FIELD_ORDER) {
                    if (item.fields[f] !== undefined) {
                        emitField(out, 5, f, item.fields[f])
                    }
                }
            }
        })
    }
    return out
}

/** Split file into top-level blocks: [{ heading, name, bodyLines }]. */
function splitTopLevel(lines) {
    const blocks = []
    let cur = null
    for (const line of lines) {
        const m = /^# (\w+)$/.exec(line)
        if (m) {
            cur = { heading: line, name: m[1], bodyLines: [] }
            blocks.push(cur)
            continue
        }
        if (cur) cur.bodyLines.push(line)
        else {
            // content before first heading (shouldn't happen) — keep as pseudo-block
            cur = { heading: null, name: null, bodyLines: [line] }
            blocks.push(cur)
        }
    }
    return blocks
}

for (const file of files) {
    const raw = readFileSync(file, "utf8")
    const hadTrailingNewline = raw.endsWith("\n")
    const lines = raw.replace(/\n$/, "").split("\n")
    const blocks = splitTopLevel(lines)
    const out = []
    for (const block of blocks) {
        if (block.heading === null) {
            out.push(...block.bodyLines)
            continue
        }
        out.push(block.heading)
        if (LANG_SECTIONS.has(block.name)) {
            // strip trailing blank lines from the body before parsing
            const buckets = parseLangSection(block.bodyLines)
            const alreadyNew = buckets.every((b) => b.lang === null)
            if (alreadyNew) {
                // no `### lang` buckets found — assume already migrated, pass through
                out.push(...block.bodyLines)
            } else {
                out.push(...emitTransposed(buckets))
            }
        } else {
            out.push(...block.bodyLines)
        }
    }
    let result = out.join("\n")
    if (hadTrailingNewline && !result.endsWith("\n")) result += "\n"
    writeFileSync(file, result, "utf8")
    console.log(`transposed: ${file}`)
}
