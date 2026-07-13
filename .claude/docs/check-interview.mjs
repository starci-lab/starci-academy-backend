#!/usr/bin/env node
/**
 * check-interview.mjs — gate cho mock-interview bank (technical + behavioral/EQ).
 *
 * Dùng: node .claude/docs/check-interview.mjs <bank-dir | mock-interview(-eq)-root> [...] [--json]
 *   <bank-dir> = .../mock-interview/<N>-bank (technical) hoặc .../mock-interview-eq/<N>-bank (behavioral)
 *   Có thể truyền thư mục cha — script tự walk tìm bank con (có vi.md).
 * Spec đầy đủ: .claude/docs/rules/interview-answer.md
 *
 * WARN cấu trúc (mục tiêu §0 target shape — 1 bank/module × 15 câu, 7 category): technical bank ≠ 15 câu ·
 * lệch phân bố category (theory2/scenario2/reasoning3/debug2/review2/optimize2/design-lite2) ·
 * <3 junior / <3 senior mỗi bank · (course) bank ≠ số module. EQ global KHÔNG theo shape này.
 *
 * Parser mirror ĐÚNG grammar thật của `ExtractJsonFromMdService`
 * (src/modules/init/seeders/shared/extracts/extract-json-from-md.service.ts) — heading-level
 * đệ quy, mỗi field/level BẮT BUỘC bọc `<!-- @starci/seperator -->` cả đầu lẫn cuối mới được
 * coi là "bounded leaf" (tách marker khỏi giá trị); không bọc → marker LỌT vào giá trị (đúng
 * bug gốc từng bắt được lúc seed thật — gate cũ thiếu separator mở đầu nên PASS nhầm).
 *
 * Verify mỗi bank:
 *  (a) bank meta {vi,en}.md: sortIndex/title, moduleRefs bắt buộc(technical)/cấm(behavioral).
 *  (b) mỗi question (questions/<n>-question/{vi,en}.md): field chung đủ, family/tier/kind đúng enum,
 *      kind khớp family.
 *  (c) technical: debug/review/optimize có givenCode+givenLang HOẶC # langs (mutually exclusive, mỗi
 *      langs item có ### lang + ### givenCode); design dùng rubricByTier (KHÔNG rubric chung); kind khác
 *      dùng rubric list; coding/debug/review/optimize rubric item có tag 4-chiều; luôn có idealAnswer;
 *      không lẫn field behavioral-only.
 *  (d) behavioral: có competency+ownershipSignal; rubric ĐÚNG 6 item theo đúng thứ tự STAR có tag; không
 *      lẫn field technical-only.
 *  (e) question folder index liên tục từ 0.
 *  (f) vi.md ↔ en.md mirror family/kind.
 *  (g) placement: family suy từ path (mock-interview-eq -> behavioral, .../mock-interview/ -> technical);
 *      lệch = FAIL.
 */
import fs from "node:fs"
import path from "node:path"

const TECH_KINDS = new Set(["theory", "reasoning", "scenario", "debug", "review", "optimize", "design-lite", "coding", "design"])
// Per-language body folders (mirror lesson content) for code-rendering questions.
const BODY_LANGS = ["0-typescript", "1-java", "2-csharp", "3-go"]
const CODE_KINDS = new Set(["debug", "review", "optimize", "coding"])
// Per-module bank target distribution (§0): 15 questions across 7 spoken categories.
const TECH_DIST = { theory: 2, scenario: 2, reasoning: 3, debug: 2, review: 2, optimize: 2, "design-lite": 2 }
const BEH_KINDS = new Set(["behavioral", "situational", "culture"])
const TIERS = new Set(["junior", "middle", "senior"])
const DIMS_4 = new Set(["communication", "problemSolving", "technical", "testing"])
const STAR_6 = ["situationClarity", "actionSpecificity", "resultImpact", "selfAwareness", "communication", "relevanceToRole"]
const SEP = /<!--\s*@starci\/seperator\s*-->/
const VI_DIACRITICS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

/**
 * Splits `lines` into sibling sections opened by headings at exactly `level`
 * (`#`.repeat(level) + " "), fence-aware, respecting an open bounded-leaf so a
 * `#`-looking line INSIDE a verbatim value never gets misread as a new heading.
 */
function splitSections (lines, level) {
    const prefix = "#".repeat(level) + " "
    const sections = []
    let currentKey = null
    let body = []
    let inFence = false
    let sectionIsLeaf = null
    let inLeaf = false
    const flush = () => {
        if (currentKey !== null) sections.push({ key: currentKey, body })
        body = []
    }
    for (const line of lines) {
        if (line.trim().startsWith("```")) inFence = !inFence
        const isHeadingHere = !inFence && line.startsWith(prefix)
        if (isHeadingHere && !inLeaf) {
            flush()
            currentKey = line.slice(prefix.length).trim()
            sectionIsLeaf = null
            inLeaf = false
            continue
        }
        if (currentKey !== null && sectionIsLeaf === null && line.trim().length > 0) {
            sectionIsLeaf = !inFence && SEP.test(line)
        }
        if (!inFence && sectionIsLeaf === true && SEP.test(line)) inLeaf = !inLeaf
        if (currentKey !== null) body.push(line)
    }
    flush()
    return sections
}

/** Resolves one section's body: bounded leaf (strip open/close SEP) or recurse one level deeper. */
function resolveValue (bodyLines, level) {
    const firstNonBlank = bodyLines.findIndex((l) => l.trim().length > 0)
    if (firstNonBlank !== -1 && SEP.test(bodyLines[firstNonBlank])) {
        const sepIdxs = []
        bodyLines.forEach((l, i) => { if (SEP.test(l)) sepIdxs.push(i) })
        const closeIdx = sepIdxs.length > 1 ? sepIdxs[sepIdxs.length - 1] : bodyLines.length
        return bodyLines.slice(sepIdxs[0] + 1, closeIdx).join("\n").trim()
    }
    return parseLevel(bodyLines, level + 1)
}

/** Parses one heading level into an object (string keys), array (numeric keys), or string leaf. */
function parseLevel (lines, level) {
    const sections = splitSections(lines, level)
    if (sections.length === 0) return lines.join("\n").trim()
    if (sections.every((s) => /^\d+$/.test(s.key))) {
        return sections
            .map((s) => {
                const value = resolveValue(s.body, level)
                const orderIndex = Number(s.key)
                if (value !== null && typeof value === "object" && !Array.isArray(value)) {
                    return { ...value, orderIndex }
                }
                return { orderIndex, value }
            })
            .sort((a, b) => a.orderIndex - b.orderIndex)
    }
    const obj = {}
    for (const s of sections) obj[s.key] = resolveValue(s.body, level)
    return obj
}

/** Parses a whole mount markdown file into its top-level field object. */
function parseFields (text) {
    const lines = text.split(/\r?\n/)
    const result = parseLevel(lines, 1)
    return result && typeof result === "object" && !Array.isArray(result) ? result : {}
}

/** Scalar field accessor — "" when missing/non-string (e.g. an array/list field). */
const val = (obj, k) => (typeof obj[k] === "string" ? obj[k] : "")
/** List field accessor — [] when missing. */
const list = (obj, k) => (Array.isArray(obj[k]) ? obj[k] : [])

function checkQuestion (dir, pathFamily) {
    const fails = []
    const warns = []
    const viPath = path.join(dir, "vi.md")
    const enPath = path.join(dir, "en.md")
    if (!fs.existsSync(viPath)) return { q: dir, fails: ["thiếu vi.md"], warns: [] }
    const vi = parseFields(fs.readFileSync(viPath, "utf8"))
    const en = fs.existsSync(enPath) ? parseFields(fs.readFileSync(enPath, "utf8")) : null

    const family = val(vi, "family") || pathFamily
    const kind = val(vi, "kind")
    const tier = val(vi, "tier")

    if (!val(vi, "sortIndex")) fails.push("thiếu # sortIndex")
    if (!family) fails.push("thiếu # family (và không suy được từ path)")
    else if (family !== "technical" && family !== "behavioral") fails.push(`family sai enum: '${family}'`)
    if (!tier) fails.push("thiếu # tier")
    else if (!TIERS.has(tier)) fails.push(`tier sai enum: '${tier}'`)
    if (!kind) fails.push("thiếu # kind")
    // Per-language bodies/ (folder per lang, mirrors lesson content) for code questions.
    const isCodeKind = CODE_KINDS.has(kind)
    const bodiesRoot = path.join(dir, "bodies")
    const bodyDirs = fs.existsSync(bodiesRoot)
        ? fs.readdirSync(bodiesRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
        : []
    const hasBodies = bodyDirs.length > 0
    const fullBodies = hasBodies && BODY_LANGS.every((l) => bodyDirs.includes(l))
    // Root # prompt / # idealAnswer are the agnostic fallback — required UNLESS all 4 bodies exist.
    const rootNeedsAgnostic = !(isCodeKind && fullBodies)
    if (rootNeedsAgnostic && !val(vi, "prompt")) fails.push("thiếu # prompt (root agnostic bắt buộc khi chưa đủ 4 bodies)")

    if (family === "technical") {
        if (kind && !TECH_KINDS.has(kind)) fails.push(`kind '${kind}' không hợp lệ cho family technical`)
        if (hasBodies) {
            if (!isCodeKind) fails.push(`kind=${kind} không dùng bodies/ (chỉ debug/review/optimize/coding)`)
            for (const b of bodyDirs) {
                if (!BODY_LANGS.includes(b)) { fails.push(`bodies/: thư mục '${b}' không thuộc {0-typescript,1-java,2-csharp,3-go}`); continue }
                const bviP = path.join(bodiesRoot, b, "vi.md")
                const benP = path.join(bodiesRoot, b, "en.md")
                if (!fs.existsSync(bviP)) { fails.push(`bodies/${b}: thiếu vi.md`); continue }
                const bvi = parseFields(fs.readFileSync(bviP, "utf8"))
                if (!val(bvi, "lang")) fails.push(`bodies/${b}: thiếu # lang`)
                if (!val(bvi, "prompt")) fails.push(`bodies/${b}: thiếu # prompt`)
                if (!val(bvi, "givenCode")) fails.push(`bodies/${b}: thiếu # givenCode`)
                if (!val(bvi, "idealAnswer")) fails.push(`bodies/${b}: thiếu # idealAnswer`)
                if (!fs.existsSync(benP)) fails.push(`bodies/${b}: thiếu en.md (mirror)`)
                else if (val(parseFields(fs.readFileSync(benP, "utf8")), "lang") !== val(bvi, "lang")) fails.push(`bodies/${b}: vi/en lệch # lang`)
            }
            if (!fullBodies) warns.push(`bodies/ mới có ${bodyDirs.length}/4 lang (${bodyDirs.join(",")}) — cần root agnostic # prompt/# idealAnswer làm fallback`)
            if (val(vi, "givenCode") || val(vi, "givenLang")) warns.push("đã có bodies/ mà root vẫn còn # givenCode/# givenLang — nên bỏ (code nằm trong bodies)")
        } else if (["debug", "review", "optimize"].includes(kind)) {
            // Legacy single-stack inline (no per-lang bodies).
            if (!val(vi, "givenCode")) fails.push(`kind=${kind}: thiếu # givenCode (hoặc tách bodies/ theo lang)`)
            if (!val(vi, "givenLang")) fails.push(`kind=${kind}: thiếu # givenLang (hoặc tách bodies/ theo lang)`)
        }
        if (kind === "design") {
            const rbt = list(vi, "rubricByTier")
            if (rbt.length < 3) fails.push("kind=design: thiếu # rubricByTier (cần 3 đoạn junior/middle/senior)")
            if (list(vi, "rubric").length) fails.push("kind=design: không được có # rubric chung — phải dùng # rubricByTier")
        } else {
            const r = list(vi, "rubric")
            if (!r.length) fails.push("thiếu # rubric")
            else if (["coding", "debug", "review", "optimize"].includes(kind)) {
                r.forEach((item, idx) => {
                    const text = typeof item.value === "string" ? item.value : ""
                    const m = text.match(/^\[(\w+)\]/)
                    if (!m || !DIMS_4.has(m[1])) fails.push(`rubric item ${idx}: thiếu/sai tag 4-chiều (phải mở đầu [communication|problemSolving|technical|testing])`)
                })
            }
        }
        if (rootNeedsAgnostic && !val(vi, "idealAnswer")) fails.push("thiếu # idealAnswer (root agnostic bắt buộc khi chưa đủ 4 bodies)")
        if (val(vi, "competency")) fails.push("technical question không được có # competency (behavioral-only)")
        if (val(vi, "ownershipSignal")) fails.push("technical question không được có # ownershipSignal (behavioral-only)")
    } else if (family === "behavioral") {
        if (kind && !BEH_KINDS.has(kind)) fails.push(`kind '${kind}' không hợp lệ cho family behavioral`)
        if (!val(vi, "competency")) fails.push("thiếu # competency")
        if (!val(vi, "ownershipSignal")) fails.push("thiếu # ownershipSignal")
        const r = list(vi, "rubric")
        if (r.length !== 6) {
            fails.push(`rubric behavioral phải đúng 6 item STAR (hiện có ${r.length})`)
        } else {
            r.forEach((item, idx) => {
                const text = typeof item.value === "string" ? item.value : ""
                const m = text.match(/^\[(\w+)\]/)
                const expected = STAR_6[idx]
                if (!m) fails.push(`rubric item ${idx}: thiếu tag STAR (phải mở đầu [${expected}])`)
                else if (m[1] !== expected) fails.push(`rubric item ${idx}: tag '${m[1]}' sai vị trí (phải là [${expected}])`)
            })
        }
        if (val(vi, "diagram")) fails.push("behavioral question không được có # diagram (technical-only)")
        if (val(vi, "givenCode")) fails.push("behavioral question không được có # givenCode (technical-only)")
        if (list(vi, "rubricByTier").length) fails.push("behavioral question không được có # rubricByTier (technical-only)")
        if (list(vi, "langs").length) fails.push("behavioral question không được có # langs (technical-only)")
    }

    const prompt = val(vi, "prompt")
    if (prompt && prompt.length > 20 && !VI_DIACRITICS.test(prompt)) warns.push("# prompt (vi) có vẻ thiếu dấu tiếng Việt — kiểm tra lại")

    if (en) {
        const eFamily = val(en, "family") || family
        const eKind = val(en, "kind")
        if (eKind && kind && eKind !== kind) fails.push(`vi/en lệch kind (vi=${kind}, en=${eKind})`)
        if (eFamily && family && eFamily !== family) fails.push(`vi/en lệch family (vi=${family}, en=${eFamily})`)
    } else {
        warns.push("thiếu en.md")
    }

    return { q: dir, family, kind, tier, fails, warns }
}

function checkBankMeta (bankDir, pathFamily) {
    const fails = []
    const viPath = path.join(bankDir, "vi.md")
    if (!fs.existsSync(viPath)) return { fails: ["bank thiếu vi.md (meta)"] }
    const vi = parseFields(fs.readFileSync(viPath, "utf8"))
    if (!val(vi, "sortIndex")) fails.push("bank meta thiếu # sortIndex")
    if (!val(vi, "title")) fails.push("bank meta thiếu # title")
    if (pathFamily === "technical" && !list(vi, "moduleRefs").length) fails.push("bank technical thiếu # moduleRefs")
    if (pathFamily === "behavioral" && list(vi, "moduleRefs").length) fails.push("bank behavioral không được có # moduleRefs")
    return { fails }
}

/** family suy từ path: chứa 'mock-interview-eq' -> behavioral; nằm trong '.../mock-interview/' -> technical. */
function familyFromPath (p) {
    const norm = p.replace(/\\/g, "/")
    if (norm.includes("mock-interview-eq")) return "behavioral"
    if (norm.includes("/mock-interview/")) return "technical"
    return null
}

const isBankDir = (d) => /[\\/](mock-interview|mock-interview-eq)[\\/][^\\/]+$/.test(d.replace(/\\/g, "/")) && fs.existsSync(path.join(d, "vi.md"))
function collectBankDirs (root) {
    if (isBankDir(root)) return [root]
    const out = []
    const walk = (d) => {
        if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) return
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (!e.isDirectory()) continue
            const p = path.join(d, e.name)
            if (isBankDir(p)) out.push(p)
            else walk(p)
        }
    }
    walk(root)
    return out
}

function collectQuestionDirs (bankDir) {
    const qRoot = path.join(bankDir, "questions")
    if (!fs.existsSync(qRoot)) return []
    const numOf = (p) => { const m = path.basename(p).match(/^(\d+)-/); return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER }
    return fs.readdirSync(qRoot, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(qRoot, e.name))
        .sort((a, b) => numOf(a) - numOf(b) || a.localeCompare(b))
}

function checkBank (bankDir) {
    const family = familyFromPath(bankDir)
    if (!family) return { bank: bankDir, family: null, fails: ["không suy được family từ path (cần chứa 'mock-interview-eq' hoặc nằm trong '.../mock-interview/')"], questions: [] }
    const meta = checkBankMeta(bankDir, family)
    const qDirs = collectQuestionDirs(bankDir)
    if (!qDirs.length) meta.fails.push("bank không có câu hỏi nào trong questions/")
    const questions = qDirs.map((d) => checkQuestion(d, family))
    questions.forEach((q, i) => {
        const m = path.basename(q.q).match(/^(\d+)-question$/)
        if (m && Number(m[1]) !== i) meta.fails.push(`question folder lệch thứ tự: vị trí ${i} là '${path.basename(q.q)}'`)
    })
    // WARN cấu trúc (mục tiêu §0 target shape — 1 bank/module × 15 câu, 7 category + ≥3/≥3 tier):
    const bankWarns = []
    if (family === "technical") {
        if (questions.length !== 15) bankWarns.push(`bank có ${questions.length} câu (mục tiêu 15)`)
        const juniors = questions.filter((q) => q.tier === "junior").length
        const seniors = questions.filter((q) => q.tier === "senior").length
        if (juniors < 3) bankWarns.push(`chỉ ${juniors} junior (mục tiêu ≥3)`)
        if (seniors < 3) bankWarns.push(`chỉ ${seniors} senior (mục tiêu ≥3)`)
        // Category distribution vs §0 target (soft — curate-then-fill may deviate mid-build).
        const byKind = {}
        questions.forEach((q) => { if (q.kind) byKind[q.kind] = (byKind[q.kind] ?? 0) + 1 })
        for (const [k, want] of Object.entries(TECH_DIST)) {
            const got = byKind[k] ?? 0
            if (got !== want) bankWarns.push(`kind '${k}': ${got} câu (mục tiêu ${want})`)
        }
        const offShape = Object.keys(byKind).filter((k) => !(k in TECH_DIST))
        for (const k of offShape) bankWarns.push(`kind '${k}' không thuộc 7 category per-module (coding→/practice, design→capstone)`)
    }
    const totalFails = meta.fails.length + questions.reduce((s, q) => s + q.fails.length, 0)
    return { bank: bankDir, family, fails: meta.fails, warns: bankWarns, questions, totalFails }
}

const argv = process.argv.slice(2)
const json = argv.includes("--json")
const roots = argv.filter((a) => a !== "--json")
if (!roots.length) { console.error("Dùng: node .claude/docs/check-interview.mjs <bank-dir | mock-interview(-eq) root> [...] [--json]"); process.exit(2) }

const bankDirs = roots.flatMap(collectBankDirs)
if (!bankDirs.length) { console.error("Không tìm thấy bank nào (cần vi.md trong 1 thư mục dưới mock-interview/ hoặc mock-interview-eq/)"); process.exit(2) }

const results = bankDirs.map(checkBank)
const failedBanks = results.filter((r) => r.totalFails ?? r.fails.length)

if (json) {
    console.log(JSON.stringify({ total: results.length, failedBanks: failedBanks.length, results }, null, 2))
} else {
    for (const r of results) {
        const rel = r.bank.replace(/\\/g, "/")
        const n = r.totalFails ?? r.fails.length
        console.log(`${n ? "✗" : "✓"} ${rel}  [${r.family || "?"}]`)
        for (const f of r.fails) console.log(`    - ${f}`)
        for (const w of r.warns || []) console.log(`    ~ ${w}`)
        for (const q of r.questions || []) {
            if (q.fails.length) {
                console.log(`    ✗ ${path.basename(q.q)}`)
                for (const f of q.fails) console.log(`        - ${f}`)
            }
            for (const w of q.warns || []) console.log(`    ~ ${path.basename(q.q)}: ${w}`)
        }
    }
    // WARN 1-bank/module: gom technical bank theo course, cảnh báo course nào có số bank
    // ≠ số module thật (đọc courses/<c>/modules/). EQ global bỏ qua.
    const byCourse = new Map()
    for (const r of results) {
        if (r.family !== "technical") continue
        const m = r.bank.replace(/\\/g, "/").match(/(.*\/courses\/([^/]+))\/mock-interview\//)
        if (!m) continue
        const entry = byCourse.get(m[2]) ?? { count: 0, root: m[1] }
        entry.count += 1
        byCourse.set(m[2], entry)
    }
    for (const [course, { count, root }] of byCourse) {
        let modCount = null
        try {
            modCount = fs.readdirSync(path.join(root, "modules"), { withFileTypes: true })
                .filter((e) => e.isDirectory()).length
        } catch { /* modules dir not reachable from this run */ }
        if (modCount != null && count !== modCount) {
            console.log(`~ course '${course}': ${count} bank technical / ${modCount} module (mục tiêu 1 bank/module)`)
        }
    }
    console.log(`\n${results.length} bank · ${failedBanks.length} fail`)
}
process.exit(failedBanks.length ? 1 : 0)
