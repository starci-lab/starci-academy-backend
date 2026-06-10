// Splits monolithic flashcard decks (deck en.md/vi.md with a `# cards` section)
// into the per-card-folder layout:
//   flashcard-decks/<deck>/en.md          (meta: title/description/contentRefs/moduleRefs)
//   flashcard-decks/<deck>/cards/<i>-card/{en,vi}.md   (one interview question each)
// Heading shift inside a card: `### x` -> `# x`, `#### x` -> `## x`.
// Idempotent: a deck whose en.md has no `# cards` line is skipped.
import fs from "fs"
import path from "path"

const ROOT = ".mount/data/courses"
const COURSES = ["0-fullstack-mastery", "1-system-design-mastery"]

/** Split one monolithic deck file into { meta, cards: [{index, body}] } or null. */
function splitDeckFile(text) {
    const lines = text.split(/\r?\n/)
    const cardsIdx = lines.findIndex((l) => l.trim() === "# cards")
    if (cardsIdx === -1) {
        return null
    }
    const meta = lines.slice(0, cardsIdx).join("\n").replace(/\s+$/, "") + "\n"
    const blocks = []
    let cur = null
    for (const line of lines.slice(cardsIdx + 1)) {
        const m = line.match(/^##\s+(\d+)\s*$/)
        if (m) {
            if (cur) blocks.push(cur)
            cur = { index: Number(m[1]), lines: [] }
        } else if (cur) {
            cur.lines.push(line)
        }
    }
    if (cur) blocks.push(cur)
    const cards = blocks.map((b) => ({
        index: b.index,
        body: b.lines
            .join("\n")
            .replace(/^####\s/gm, "## ")
            .replace(/^###\s/gm, "# ")
            .replace(/^\s+/, "")
            .replace(/\s+$/, "") + "\n",
    }))
    return { meta, cards }
}

let deckCount = 0
let cardCount = 0
for (const course of COURSES) {
    const decksDir = path.join(ROOT, course, "flashcard-decks")
    if (!fs.existsSync(decksDir)) continue
    for (const deck of fs.readdirSync(decksDir)) {
        const deckDir = path.join(decksDir, deck)
        if (!fs.statSync(deckDir).isDirectory()) continue
        let split = false
        for (const locale of ["en", "vi"]) {
            const file = path.join(deckDir, `${locale}.md`)
            if (!fs.existsSync(file)) continue
            const res = splitDeckFile(fs.readFileSync(file, "utf8"))
            if (!res) continue
            split = true
            fs.writeFileSync(file, res.meta)
            for (const c of res.cards) {
                const cardDir = path.join(deckDir, "cards", `${c.index}-card`)
                fs.mkdirSync(cardDir, { recursive: true })
                fs.writeFileSync(path.join(cardDir, `${locale}.md`), c.body)
                if (locale === "en") cardCount++
            }
        }
        if (split) deckCount++
    }
}
console.log(`split done: ${deckCount} decks, ${cardCount} cards`)
