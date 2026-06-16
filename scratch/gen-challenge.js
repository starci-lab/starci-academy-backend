// Deterministic generator for SD criteria-redesign challenge files (vi.md + en.md).
// Mirrors sibling format: # requirements/steps/outputs/prerequisites -> ## N -> ### langs -> #### M -> ##### lang/...
const fs = require("fs"), path = require("path")
const SEP = "<!-- @starci/seperator -->"
const LANGS = ["typescript", "java", "csharp", "go"]

function leaf(v) { return `${SEP}\n${v}\n${SEP}\n` }

// requirements: [{score, body:{lang:{title, body}}}]
function reqBlock(reqs, locale) {
  let s = "# requirements\n"
  reqs.forEach((r, i) => {
    s += `## ${i}\n### langs\n`
    LANGS.forEach((lang, m) => {
      const d = r.body[lang]
      s += `#### ${m}\n##### lang\n${leaf(lang)}##### title\n${leaf(d.title[locale])}##### body\n${leaf(d.body[locale])}##### score\n${leaf(String(r.score))}`
    })
  })
  return s
}
// steps: [{body:{lang:{title, body}}}]
function stepBlock(steps, locale) {
  let s = "# steps\n"
  steps.forEach((st, i) => {
    s += `## ${i}\n### langs\n`
    LANGS.forEach((lang, m) => {
      const d = st.body[lang]
      s += `#### ${m}\n##### lang\n${leaf(lang)}##### title\n${leaf(d.title[locale])}##### body\n${leaf(d.body[locale])}`
    })
  })
  return s
}
// outputs/prerequisites: [{text:{locale} same across langs}]
function textBlock(name, items, locale) {
  let s = `# ${name}\n`
  items.forEach((it, i) => {
    s += `## ${i}\n### langs\n`
    LANGS.forEach((lang, m) => {
      s += `#### ${m}\n##### lang\n${leaf(lang)}##### text\n${leaf(it.text[locale])}`
    })
  })
  return s
}

function build(meta, locale) {
  let s = ""
  s += `# sortIndex\n${leaf(String(meta.sortIndex))}`
  s += `# title\n${leaf(meta.title[locale])}`
  s += `# description\n${leaf(meta.description[locale])}`
  s += reqBlock(meta.requirements, locale)
  s += stepBlock(meta.steps, locale)
  s += textBlock("outputs", meta.outputs, locale)
  s += textBlock("prerequisites", meta.prerequisites, locale)
  s += `# difficulty\n${leaf(meta.difficulty)}`
  s += `# score\n${leaf(String(meta.score))}`
  return s
}

function write(meta, dir) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "vi.md"), build(meta, "vi"))
  fs.writeFileSync(path.join(dir, "en.md"), build(meta, "en"))
  const perLang = meta.requirements.reduce((a, r) => a + r.score, 0)
  console.log(`wrote ${dir}\n  difficulty=${meta.difficulty} score=${meta.score} per-lang-sum=${perLang} reqs=${meta.requirements.length} steps=${meta.steps.length}`)
}
module.exports = { write }
