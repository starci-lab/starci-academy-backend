#!/usr/bin/env node
/**
 * check-flashcard.mjs — gate deterministic cho FLASHCARD deck + card (.claude/docs không có gate flashcard sẵn).
 *
 * Dùng: node .claude/docs/check-flashcard.mjs <path> [<path> ...] [--json]
 *   <path> = deck-dir (…/flashcard-decks/<N>-<slug>)  · course flashcard-decks-dir (walk mọi deck)
 *            · 1 card-dir (…/cards/<n>-card).  Tự walk tìm deck (có vi.md + cards/).
 *
 * GATE = CẤU TRÚC (rule .claude/docs/rules/flashcard-answer.md §0/§3), KHÔNG phán chất lượng §1 (đó là judge agent):
 *  FAIL (cứng): thiếu field bắt buộc · answer rỗng · level sai enum · sortIndex ≠ số folder · card không liên tục từ 0
 *    · vi.md tiếng Việt KHÔNG DẤU · vi↔en lệch field-set/level/sortIndex · :::muted/:::chip/::: KHÔNG cân · difficulty sai enum.
 *  WARN (mục tiêu curate §0): deck ≠ 10 card · phân bố level < (3 junior + 3 senior/staff) · (course) ≠ 15 deck.
 *
 * Card field (DSL `# field` + `<!-- @starci/seperator -->`): sortIndex · isPremium · question · level · tags · answer.
 * Deck meta {vi,en}.md: sortIndex · title · description · difficulty · moduleRefs.
 */
import fs from "node:fs"
import path from "node:path"

const CARD_FIELDS = ["sortIndex", "isPremium", "question", "level", "tags", "answer"]
const DECK_FIELDS = ["sortIndex", "title", "description", "difficulty", "moduleRefs"]
const LEVELS = new Set(["junior", "middle", "senior", "staff"])
const DIFFS = new Set(["easy", "medium", "hard", "insane"])

// Vietnamese diacritic detector (port từ check-lesson.ps1).
const VNDIA = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
const NODIA = /\b(khong|duoc|nhung|phai|kiem thu|chuan bi|ban chat|hoc vien|thuc hanh|cau hoi|tra loi|co che|dao sau|bay thuong|tu khoa)\b/i

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes("--json")
const paths = argv.filter((a) => !a.startsWith("--"))
if (!paths.length) { console.error("Dùng: node .claude/docs/check-flashcard.mjs <deck|course-decks|card-dir> [...] [--json]"); process.exit(2) }

/** Parse DSL `# field` → Map(name → raw content). `## N` (list item) KHÔNG bị bắt là field. */
function parseFields (text) {
  const fields = new Map()
  let cur = null, buf = []
  const flush = () => { if (cur !== null) fields.set(cur, buf.join("\n")) }
  for (const l of text.split(/\r?\n/)) {
    const m = /^# (.+?)\s*$/.exec(l)
    if (m) { flush(); cur = m[1].trim(); buf = [] } else if (cur !== null) buf.push(l)
  }
  flush()
  return fields
}
/** Giá trị field bỏ separator + `## N` + trắng. */
function val (raw) {
  if (raw == null) return ""
  return raw.split(/\r?\n/)
    .filter((l) => !/^<!--\s*@starci\/seperator\s*-->/.test(l.trim()) && !/^##\s+\d+\s*$/.test(l.trim()))
    .join("\n").trim()
}
/** Prose ngoài code-fence + inline-code (để soi tiếng Việt không dấu). */
function prose (text) {
  return text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ")
}

const results = []
function rec (ctx, fails, warns) { results.push({ ctx, fails, warns }) }

/** Đọc {vi,en}.md của 1 folder. */
function readVE (dir) {
  const vi = path.join(dir, "vi.md"), en = path.join(dir, "en.md")
  return {
    vi: fs.existsSync(vi) ? fs.readFileSync(vi, "utf8") : null,
    en: fs.existsSync(en) ? fs.readFileSync(en, "utf8") : null,
  }
}

function checkCard (cardDir, expectIdx) {
  const ctx = path.relative(process.cwd(), cardDir).replace(/\\/g, "/")
  const fails = [], warns = []
  const { vi, en } = readVE(cardDir)
  if (!vi) { fails.push("thiếu vi.md"); rec(ctx, fails, warns); return null }
  if (!en) warns.push("thiếu en.md (bilingual chưa xong)")

  const fv = parseFields(vi), fe = en ? parseFields(en) : null
  for (const f of CARD_FIELDS) {
    if (!fv.has(f)) fails.push(`vi thiếu field # ${f}`)
    if (fe && !fe.has(f)) fails.push(`en thiếu field # ${f}`)
  }
  // non-empty question + answer
  for (const f of ["question", "answer"]) {
    if (fv.has(f) && !val(fv.get(f))) fails.push(`vi # ${f} rỗng`)
    if (fe && fe.has(f) && !val(fe.get(f))) fails.push(`en # ${f} rỗng`)
  }
  // level enum + mirror
  const lvV = val(fv.get("level") || "")
  if (lvV && !LEVELS.has(lvV)) fails.push(`level vi sai enum: '${lvV}' (junior|middle|senior|staff)`)
  if (fe) {
    const lvE = val(fe.get("level") || "")
    if (lvE && !LEVELS.has(lvE)) fails.push(`level en sai enum: '${lvE}'`)
    if (lvV && lvE && lvV !== lvE) fails.push(`level vi↔en lệch: ${lvV} ≠ ${lvE}`)
  }
  // sortIndex khớp folder
  const siV = val(fv.get("sortIndex") || "")
  if (expectIdx != null && siV !== String(expectIdx)) fails.push(`sortIndex vi='${siV}' ≠ số folder ${expectIdx}`)
  if (fe && val(fe.get("sortIndex") || "") !== siV) fails.push(`sortIndex vi↔en lệch`)
  // :::muted / :::chip / ::: cân trong answer (structure Interview-Arc)
  for (const [lab, txt] of [["vi", vi], ["en", en]]) {
    if (!txt) continue
    const ans = val(parseFields(txt).get("answer") || "")
    const muted = (ans.match(/^:::muted\b/gm) || []).length
    const chip = (ans.match(/^:::chip\b/gm) || []).length
    const opens = muted + chip
    const closes = (ans.match(/^:::\s*$/gm) || []).length
    if (muted === 0) warns.push(`${lab} answer KHÔNG có :::muted (Interview-Arc?)`)
    if (opens !== closes) fails.push(`${lab} answer :::muted/:::chip KHÔNG cân (mở ${opens} ≠ đóng ${closes})`)
  }
  // vi đủ dấu
  const pv = prose(vi)
  if (!VNDIA.test(pv)) fails.push("vi.md prose 0 dấu tiếng Việt (KHÔNG DẤU toàn file?)")
  const hit = NODIA.exec(pv.toLowerCase())
  if (hit) fails.push(`vi.md tiếng Việt KHÔNG DẤU (token '${hit[0]}')`)
  // field-set mirror
  if (fe && [...fv.keys()].sort().join(",") !== [...fe.keys()].sort().join(",")) fails.push(`field-set vi↔en lệch`)

  rec(ctx, fails, warns)
  return { level: lvV }
}

function checkDeck (deckDir) {
  const ctx = path.relative(process.cwd(), deckDir).replace(/\\/g, "/")
  const fails = [], warns = []
  const { vi, en } = readVE(deckDir)
  if (!vi) fails.push("thiếu deck vi.md")
  if (!en) fails.push("thiếu deck en.md")
  if (vi) {
    const fv = parseFields(vi)
    for (const f of DECK_FIELDS) if (!fv.has(f)) fails.push(`deck vi thiếu # ${f}`)
    const diff = val(fv.get("difficulty") || "")
    if (diff && !DIFFS.has(diff)) fails.push(`deck difficulty sai enum: '${diff}'`)
  }
  // cards liên tục từ 0
  const cardsDir = path.join(deckDir, "cards")
  const levels = []
  if (fs.existsSync(cardsDir)) {
    const cardDirs = fs.readdirSync(cardsDir).filter((d) => /^\d+-card$/.test(d))
      .sort((a, b) => parseInt(a) - parseInt(b))
    const nums = cardDirs.map((d) => parseInt(d))
    for (let i = 0; i < nums.length; i++) if (nums[i] !== i) { fails.push(`card KHÔNG liên tục từ 0 (thấy ${nums[i]} ở vị trí ${i})`); break }
    for (const d of cardDirs) {
      const r = checkCard(path.join(cardsDir, d), parseInt(d))
      if (r && r.level) levels.push(r.level)
    }
    if (cardDirs.length !== 10) warns.push(`deck có ${cardDirs.length} card (chuẩn §0 = 10)`)
    const jr = levels.filter((l) => l === "junior").length
    const sr = levels.filter((l) => l === "senior" || l === "staff").length
    if (jr < 3) warns.push(`chỉ ${jr} card junior (§0 cần ≥3)`)
    if (sr < 3) warns.push(`chỉ ${sr} card senior/staff (§0 cần ≥3)`)
  } else fails.push("thiếu thư mục cards/")
  rec(ctx, fails, warns)
}

/** Phân loại path: deck (có cards/) · course flashcard-decks (chứa nhiều deck) · card-dir. */
function walk (p) {
  const abs = path.resolve(p)
  if (!fs.existsSync(abs)) { rec(p, ["path không tồn tại"], []); return }
  if (fs.existsSync(path.join(abs, "cards"))) { checkDeck(abs); return }
  if (/\d+-card$/.test(abs)) { const idx = parseInt(path.basename(abs)); checkCard(abs, isNaN(idx) ? null : idx); return }
  // course flashcard-decks dir → walk deck con
  const subs = fs.readdirSync(abs).map((d) => path.join(abs, d)).filter((d) => fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, "cards")))
  if (subs.length) { subs.sort(); for (const d of subs) checkDeck(d); if (subs.length !== 15) rec(path.relative(process.cwd(), abs).replace(/\\/g, "/"), [], [`course có ${subs.length} deck (chuẩn §0 = 15)`]); return }
  rec(p, ["không nhận ra deck/card/course-decks (thiếu cards/ hoặc deck con)"], [])
}

for (const p of paths) walk(p)

const totalFails = results.reduce((n, r) => n + r.fails.length, 0)
const totalWarns = results.reduce((n, r) => n + r.warns.length, 0)
if (JSON_OUT) {
  console.log(JSON.stringify({ fails: totalFails, warns: totalWarns, items: results }, null, 2))
} else {
  for (const r of results) {
    if (!r.fails.length && !r.warns.length) { console.log(`PASS  ${r.ctx}`); continue }
    for (const f of r.fails) console.log(`FAIL  ${r.ctx} — ${f}`)
    for (const w of r.warns) console.log(`warn  ${r.ctx} — ${w}`)
  }
  console.log(`\n== ${totalFails} FAIL · ${totalWarns} warn ==`)
}
process.exit(totalFails > 0 ? 1 : 0)
