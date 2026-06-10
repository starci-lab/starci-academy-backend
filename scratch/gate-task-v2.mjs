// Gate for Personal Project V2 task files (en.md / vi.md).
// Usage: node scratch/gate-task-v2.mjs <taskDir> [<taskDir> ...]
// Checks per file: lang blocks, Σoutcome=30, Σapproach=70, total=100, >=1 critical,
//   body has :::muted callouts; and en/vi structural mirror.
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const SEP = "<!-- @starci/seperator -->"

/** Parse a task md into structured lang blocks. */
function parseTask(md) {
  const lines = md.split(/\r?\n/)
  // Find "# criterias" section
  const langs = []
  let i = lines.findIndex((l) => l.trim() === "# criterias")
  if (i < 0) return { error: "no # criterias section", langs }
  for (; i < lines.length; i++) {
    const l = lines[i].trim()
    if (/^## \d+$/.test(l)) {
      const block = { lang: null, hasBody: false, bodyCalloutCount: 0, outcome: [], approach: [] }
      // walk fields until next "## N" or EOF
      let j = i + 1
      let cur = null // "outcome" | "approach"
      let pendingCrit = null
      for (; j < lines.length; j++) {
        const t = lines[j].trim()
        if (/^## \d+$/.test(t)) break
        if (t === "### lang") {
          // next non-sep line is the lang value
          const v = nextLeaf(lines, j)
          block.lang = v
        } else if (t === "### body") {
          block.hasBody = true
          const leaf = leafText(lines, j)
          block.bodyCalloutCount = (leaf.match(/^:::muted/gm) || []).length
        } else if (t === "### outcome") {
          cur = "outcome"
        } else if (t === "### approach") {
          cur = "approach"
        } else if (/^##### score$/.test(t)) {
          const v = parseInt(nextLeaf(lines, j) || "NaN", 10)
          if (cur) block[cur].push({ score: v, critical: pendingCrit })
        } else if (/^##### critical$/.test(t)) {
          pendingCrit = (nextLeaf(lines, j) || "").trim() === "true"
          // attach critical to last pushed item of cur if score came first; else stored for next
          if (cur && block[cur].length) {
            const last = block[cur][block[cur].length - 1]
            if (last.critical === null || last.critical === undefined) last.critical = pendingCrit
          }
        }
      }
      langs.push(block)
      i = j - 1
    }
    if (/^# [a-zA-Z]/.test(l) && l !== "# criterias" && langs.length) {
      // reached a new top section after criterias
      break
    }
  }
  return { langs }
}

function nextLeaf(lines, idx) {
  for (let k = idx + 1; k < lines.length; k++) {
    const t = lines[k].trim()
    if (t === SEP || t === "") continue
    return t
  }
  return null
}
function leafText(lines, idx) {
  // collect text between the two SEP markers after heading
  let k = idx + 1
  while (k < lines.length && lines[k].trim() !== SEP) k++
  k++ // past first SEP
  const buf = []
  for (; k < lines.length && lines[k].trim() !== SEP; k++) buf.push(lines[k])
  return buf.join("\n")
}

function checkFile(path) {
  const errs = []
  const md = readFileSync(path, "utf8")
  if (md.includes("﻿")) errs.push("has BOM")
  const { error, langs } = parseTask(md)
  if (error) return [error]
  if (!langs.length) return ["no lang blocks parsed"]
  for (const b of langs) {
    const tag = b.lang || "?"
    if (!b.lang) errs.push("lang block missing ### lang")
    if (!b.hasBody) errs.push(`[${tag}] missing ### body`)
    if (b.bodyCalloutCount < 3) errs.push(`[${tag}] body has <3 :::muted callouts (${b.bodyCalloutCount})`)
    const oSum = b.outcome.reduce((s, c) => s + (c.score || 0), 0)
    const aSum = b.approach.reduce((s, c) => s + (c.score || 0), 0)
    if (oSum !== 30) errs.push(`[${tag}] outcome Σ=${oSum} (want 30)`)
    if (aSum !== 70) errs.push(`[${tag}] approach Σ=${aSum} (want 70)`)
    if (oSum + aSum !== 100) errs.push(`[${tag}] total=${oSum + aSum} (want 100)`)
    const crit = [...b.outcome, ...b.approach].filter((c) => c.critical === true).length
    if (crit < 1) errs.push(`[${tag}] no critical criterion`)
  }
  return errs
}

function mirrorCheck(enPath, viPath) {
  const count = (p, re) => (readFileSync(p, "utf8").match(re) || []).length
  const errs = []
  for (const [re, name] of [[/^## \d+$/gm, "## langIndex"], [/^#### \d+$/gm, "#### criterion"], [new RegExp(SEP.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "separator"]]) {
    const e = count(enPath, re), v = count(viPath, re)
    if (e !== v) errs.push(`mirror mismatch ${name}: en=${e} vi=${v}`)
  }
  return errs
}

let totalErr = 0
for (const dir of process.argv.slice(2)) {
  const en = join(dir, "en.md"), vi = join(dir, "vi.md")
  const label = dir.split(/[\\/]/).slice(-1)[0]
  const errs = []
  if (!existsSync(en)) errs.push("missing en.md")
  else errs.push(...checkFile(en).map((e) => "en: " + e))
  if (!existsSync(vi)) errs.push("missing vi.md")
  else errs.push(...checkFile(vi).map((e) => "vi: " + e))
  if (existsSync(en) && existsSync(vi)) errs.push(...mirrorCheck(en, vi))
  if (errs.length) {
    totalErr += errs.length
    console.log(`FAIL ${label}`)
    for (const e of errs) console.log("   - " + e)
  } else {
    console.log(`PASS ${label}`)
  }
}
process.exit(totalErr ? 1 : 0)
