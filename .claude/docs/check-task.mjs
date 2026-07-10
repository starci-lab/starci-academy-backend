#!/usr/bin/env node
/**
 * check-task.mjs — gate cho milestone/personal-project TASK md (.audits không có gate task sẵn).
 *
 * Dùng: node .audits/check-task.mjs <task-dir> [<task-dir> ...]
 *   <task-dir> = thư mục chứa vi.md + en.md (…/milestones/<N>-<slug>/tasks/<M>-<slug>)
 *   Có thể truyền cả thư mục cha (milestone / tasks) — script tự walk tìm các task có vi.md.
 * Cờ: --json (in JSON), mặc định in người-đọc.
 *
 * Verify mỗi task (theo plan starci-personal-project-fix):
 *  (a) brief index liên tục từ ## 0 (parser dùng vị trí .map → bỏ số = lệch UUID reseed).
 *  (b) mỗi brief lang ∈ {typescript,java,csharp,go,agnostic}.
 *  (c) mỗi brief có đủ ### lang / ### body / ### outcome / ### approach; số tiêu chí #### N khớp brief 0.
 *  (d) MỖI brief body chỉ 1 "language family" (0 cram đa-lang) — đây là check "ghi 1 lang thôi".
 *  (e) accordion cân: số ::::accordion == số đóng ::::; mỗi :::panel có title; :::/:::: cân.
 *  (f) 0 bold-inline-code (`**`x`**`).
 *  (g) vi.md ↔ en.md mirror: cùng brief-count + cùng dãy lang.
 */
import fs from "node:fs"
import path from "node:path"

const LANGS = new Set(["typescript", "java", "csharp", "go", "agnostic"])
// fence-lang -> BACKEND language family. Chỉ đếm fence PHÂN BIỆT ĐƯỢC backend-stack để bắt "cram" (1 brief
// nhồi >=2 backend lang). CỐ Ý LOẠI mọi thứ CHIA SẺ giữa các brief fullstack / dùng ở mọi stack:
//  - frontend: `tsx`/`mdx`/`jsx` + code TS thuần `ts`/`typescript`/`js` (FS = React frontend + backend tuỳ chọn →
//    java brief vẫn kèm tsx frontend, KHÔNG phải cram).
//  - data/config: `json` (appsettings/response), `xml` (pom.xml vs .csproj — mơ hồ), yaml/bash/sql/css/html/http/text.
// GIỮ tín hiệu BACKEND-MANIFEST rõ: `jsonc` = package.json (TS workspace) -> ts; `toml` = go.work -> go;
// và fence ngôn ngữ backend đặc trưng `go`/`java`/`csharp`.
const FAMILY = {
    jsonc: "ts",
    toml: "go", go: "go",
    java: "java",
    csharp: "csharp", cs: "csharp",
}

/** Tách body thành các đoạn, bảo vệ code-fence khỏi regex prose. */
const splitFences = (s) => s.split(/(```[\s\S]*?```)/g)

/** Đếm bold-inline-code `**`x`**` ngoài code-fence. */
function countBoldInlineCode (body) {
    let n = 0
    for (const g of splitFences(body)) {
        if (g.startsWith("```")) continue
        n += (g.match(/\*\*`[^`]+`\*\*/g) || []).length
        n += (g.match(/\*\*https?:\/\/[^\s*]+\*\*/g) || []).length
    }
    return n
}

/** Tập language-family xuất hiện trong các fence của 1 body. */
function fenceFamilies (body) {
    const fams = new Set()
    const re = /```([a-zA-Z0-9#+]+)/g
    let m
    while ((m = re.exec(body))) {
        const fam = FAMILY[m[1].toLowerCase()]
        if (fam) fams.add(fam)
    }
    return fams
}

/**
 * Kiểm tra accordion — CHỈ khi body có `::::accordion`. Content dùng nhiều directive 4-dấu khác
 * (`::::tab`/`::::code`/`::::preview`) nên KHÔNG đếm mọi `::::` là close của accordion (sẽ false-positive).
 * Khi có accordion: mỗi accordion ≥1 panel, panel phải có title, và phải có dòng đóng `::::`.
 */
function accordionIssues (body) {
    const opens = (body.match(/^::::accordion\b/gm) || []).length
    if (opens === 0) return [] // không có accordion → bỏ qua (đừng động vào tab/code/preview widget)
    const issues = []
    const panels = (body.match(/^:::panel\b/gm) || []).length
    const panelNoTitle = (body.match(/^:::panel(?!\{title=)/gm) || []).length
    const bareClose = (body.match(/^::::\s*$/gm) || []).length
    if (panels < opens) issues.push(`accordion thiếu panel (::::accordion=${opens}, :::panel=${panels})`)
    if (panelNoTitle > 0) issues.push(`${panelNoTitle} :::panel thiếu {title=...}`)
    if (bareClose < opens) issues.push(`accordion chưa đóng (::::accordion=${opens}, dòng đóng :::: =${bareClose})`)
    return issues
}

/**
 * Parse 1 file task md -> { briefs: [{ lang, body, outcomeCount, approachCount, hasBody, hasOutcome, hasApproach }] }
 * Chỉ cần độ chính xác đủ để gate (không tái dựng full DTO).
 */
function parseTask (text) {
    const lines = text.split(/\r?\n/)
    // tìm vùng từ "# criterias" tới hết
    const critIdx = lines.findIndex((l) => l.trim() === "# criterias")
    if (critIdx < 0) return { briefs: [], error: "không thấy '# criterias'" }

    const briefs = []
    let cur = null
    let section = null // 'lang' | 'body' | 'outcome' | 'approach'
    let buf = []
    const flush = () => {
        if (!cur || !section) { buf = []; return }
        const val = buf.join("\n").replace(/<!-- @starci\/seperator -->/g, "").trim()
        if (section === "lang") cur.lang = val.split(/\s+/)[0] || ""
        else if (section === "body") cur.body = val
        buf = []
    }
    for (let i = critIdx + 1; i < lines.length; i++) {
        const l = lines[i]
        const mBrief = l.match(/^## (\d+)\s*$/)
        const mSec = l.match(/^### (lang|body|outcome|approach)\s*$/)
        const mCrit = l.match(/^#### (\d+)\s*$/)
        if (mBrief) {
            flush(); cur = { idx: Number(mBrief[1]), lang: "", body: "", hasBody: false, hasOutcome: false, hasApproach: false, outcomeCount: 0, approachCount: 0 }
            briefs.push(cur); section = null; continue
        }
        if (mSec) {
            flush(); section = mSec[1]
            if (cur) {
                if (section === "body") cur.hasBody = true
                if (section === "outcome") cur.hasOutcome = true
                if (section === "approach") cur.hasApproach = true
            }
            continue
        }
        if (mCrit && cur) {
            if (section === "outcome") cur.outcomeCount = Math.max(cur.outcomeCount, Number(mCrit[1]) + 1)
            if (section === "approach") cur.approachCount = Math.max(cur.approachCount, Number(mCrit[1]) + 1)
        }
        if (section === "lang" || section === "body") buf.push(l)
    }
    flush()
    return { briefs }
}

function checkTask (dir) {
    const fails = []
    const viPath = path.join(dir, "vi.md")
    const enPath = path.join(dir, "en.md")
    if (!fs.existsSync(viPath)) return { task: dir, fails: ["thiếu vi.md"] }
    const vi = parseTask(fs.readFileSync(viPath, "utf8"))
    if (vi.error) return { task: dir, fails: [vi.error] }
    const en = fs.existsSync(enPath) ? parseTask(fs.readFileSync(enPath, "utf8")) : null

    // (a) index liên tục
    vi.briefs.forEach((b, i) => { if (b.idx !== i) fails.push(`brief index lệch: vị trí ${i} là '## ${b.idx}'`) })

    const crit0 = vi.briefs[0] ? { o: vi.briefs[0].outcomeCount, a: vi.briefs[0].approachCount } : { o: 0, a: 0 }
    for (const b of vi.briefs) {
        const tag = `brief ${b.idx} (${b.lang || "?"})`
        // (b) lang hợp lệ
        if (!LANGS.has(b.lang)) fails.push(`${tag}: lang không hợp lệ (phải typescript/java/csharp/go/agnostic)`)
        // (c) đủ section + tiêu chí khớp brief 0
        if (!b.hasBody) fails.push(`${tag}: thiếu ### body`)
        if (!b.hasOutcome) fails.push(`${tag}: thiếu ### outcome`)
        if (!b.hasApproach) fails.push(`${tag}: thiếu ### approach`)
        if (b.outcomeCount !== crit0.o) fails.push(`${tag}: số tiêu chí outcome (${b.outcomeCount}) ≠ brief 0 (${crit0.o})`)
        if (b.approachCount !== crit0.a) fails.push(`${tag}: số tiêu chí approach (${b.approachCount}) ≠ brief 0 (${crit0.a})`)
        // (d) 1 language family / brief
        const fams = fenceFamilies(b.body)
        if (fams.size >= 2) fails.push(`${tag}: body cram ${fams.size} ngôn ngữ [${[...fams].join(", ")}] — phải 1 lang/brief`)
        if (b.lang === "agnostic" && fams.size >= 1) {
            // agnostic mà còn code lang cụ thể -> cần split (trừ khi là FE single-track đã 1 fam, cảnh báo nhẹ)
            if (fams.size >= 2) {/* đã bắt ở trên */}
        }
        // (e) accordion + (f) bold-inline
        accordionIssues(b.body).forEach((x) => fails.push(`${tag}: ${x}`))
        const bold = countBoldInlineCode(b.body)
        if (bold > 0) fails.push(`${tag}: ${bold} bold-inline-code (**\`x\`**)`)
    }

    // (g) vi/en mirror
    if (en) {
        if (en.briefs.length !== vi.briefs.length) fails.push(`vi/en lệch brief-count (vi=${vi.briefs.length}, en=${en.briefs.length})`)
        else vi.briefs.forEach((b, i) => { if (en.briefs[i].lang !== b.lang) fails.push(`vi/en lệch lang ở brief ${i} (vi=${b.lang}, en=${en.briefs[i].lang})`) })
    } else {
        fails.push("thiếu en.md")
    }

    return { task: dir, langs: vi.briefs.map((b) => b.lang), fails }
}

/**
 * Walk tìm TASK dir. Một task = dir có vi.md NẰM DƯỚI segment `tasks/`. Cố ý bỏ qua vi.md cấp milestone
 * (milestone cũng có vi.md mô tả, KHÔNG có `# criterias`) → không nhận nhầm milestone là task.
 * Nếu truyền thẳng 1 task-dir (path chứa /tasks/ + có vi.md) thì trả luôn.
 */
const isTaskDir = (d) => /[\\/]tasks[\\/][^\\/]+$/.test(d) && fs.existsSync(path.join(d, "vi.md"))
function collectTaskDirs (root) {
    if (isTaskDir(root)) return [root]
    const out = []
    const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (!e.isDirectory()) continue
            const p = path.join(d, e.name)
            if (isTaskDir(p)) out.push(p)
            else walk(p)
        }
    }
    if (fs.existsSync(root) && fs.statSync(root).isDirectory()) walk(root)
    return out
}

const argv = process.argv.slice(2)
const json = argv.includes("--json")
const roots = argv.filter((a) => a !== "--json")
if (!roots.length) { console.error("Dùng: node .audits/check-task.mjs <task-dir> [...] [--json]"); process.exit(2) }

const taskDirs = roots.flatMap(collectTaskDirs)
const results = taskDirs.map(checkTask)
const failed = results.filter((r) => r.fails.length)

if (json) {
    console.log(JSON.stringify({ total: results.length, failedTasks: failed.length, results }, null, 2))
} else {
    for (const r of results) {
        const rel = r.task.replace(/\\/g, "/")
        if (r.fails.length) {
            console.log(`✗ ${rel}  [${(r.langs || []).join(", ")}]`)
            for (const f of r.fails) console.log(`    - ${f}`)
        } else {
            console.log(`✓ ${rel}  [${(r.langs || []).join(", ")}]`)
        }
    }
    console.log(`\n${results.length} task · ${failed.length} fail`)
}
process.exit(failed.length ? 1 : 0)
