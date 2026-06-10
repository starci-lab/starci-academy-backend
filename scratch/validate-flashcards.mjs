// Validates the per-card flashcard layout the parser expects. Reports any card
// that would fail to seed/render: missing en/vi, missing # question / # answer,
// invalid # level, en/vi card-count mismatch, deck meta missing title.
import fs from "fs"
import path from "path"

const ROOT = ".mount/data/courses"
const COURSES = ["0-fullstack-mastery", "1-system-design-mastery"]
const LEVELS = ["junior", "middle", "senior", "staff"]
const problems = []

/** Read the value under a `# heading` (between the two seperator comments). */
function field(text, heading) {
    const re = new RegExp(`^#\\s+${heading}\\s*$([\\s\\S]*?)`, "m")
    const idx = text.search(new RegExp(`^#\\s+${heading}\\s*$`, "m"))
    if (idx === -1) return null
    const after = text.slice(idx)
    const m = after.match(/<!-- @starci\/seperator -->\s*([\s\S]*?)\s*<!-- @starci\/seperator -->/)
    return m ? m[1].trim() : ""
}

let deckN = 0, cardN = 0
for (const course of COURSES) {
    const decksDir = path.join(ROOT, course, "flashcard-decks")
    if (!fs.existsSync(decksDir)) continue
    for (const deck of fs.readdirSync(decksDir).sort()) {
        const deckDir = path.join(decksDir, deck)
        if (!fs.statSync(deckDir).isDirectory()) continue
        deckN++
        const id = `${course}/${deck}`
        // deck meta
        const deckEn = path.join(deckDir, "en.md")
        if (!fs.existsSync(deckEn)) { problems.push(`${id}: missing deck en.md`); continue }
        const deckEnText = fs.readFileSync(deckEn, "utf8")
        if (!field(deckEnText, "title")) problems.push(`${id}: deck missing # title`)
        // cards
        const cardsDir = path.join(deckDir, "cards")
        if (!fs.existsSync(cardsDir)) { problems.push(`${id}: no cards/ dir`); continue }
        const cardDirs = fs.readdirSync(cardsDir).filter((c) => fs.statSync(path.join(cardsDir, c)).isDirectory())
        if (cardDirs.length === 0) problems.push(`${id}: cards/ empty`)
        for (const card of cardDirs) {
            const cid = `${id}/cards/${card}`
            const en = path.join(cardsDir, card, "en.md")
            const vi = path.join(cardsDir, card, "vi.md")
            if (!fs.existsSync(en)) { problems.push(`${cid}: missing en.md`); continue }
            if (!fs.existsSync(vi)) problems.push(`${cid}: missing vi.md`)
            cardN++
            const enT = fs.readFileSync(en, "utf8")
            if (!field(enT, "question")) problems.push(`${cid}: en missing # question`)
            if (!field(enT, "answer")) problems.push(`${cid}: en missing # answer`)
            const lvl = field(enT, "level")
            if (!lvl) problems.push(`${cid}: en missing # level`)
            else if (!LEVELS.includes(lvl.toLowerCase())) problems.push(`${cid}: invalid level "${lvl}"`)
            if (fs.existsSync(vi)) {
                const viT = fs.readFileSync(vi, "utf8")
                if (!field(viT, "question")) problems.push(`${cid}: vi missing # question`)
                if (!field(viT, "answer")) problems.push(`${cid}: vi missing # answer`)
            }
        }
    }
}
console.log(`checked ${deckN} decks, ${cardN} cards`)
if (problems.length === 0) console.log("ALL GOOD ✅")
else { console.log(`\n${problems.length} PROBLEMS:`); problems.forEach((p) => console.log(" - " + p)) }
