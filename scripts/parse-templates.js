const fs = require("fs")
const path = require("path")

const BATCH_SIZE = 5
const TASK_TOTAL_SCORE = 10
const coursePath = process.argv[2] || ".mount/data/courses/0-fullstack-mastery"
const locale = process.argv[3] || "en"
const templateFile = path.join(coursePath,
    `personal-project-context/templates/${locale}.md`)
const outputDir = path.join(coursePath, "tasks")

const content = fs.readFileSync(templateFile, "utf-8")
const lines = content.split(/\r?\n/)

const tasks = []
let current = null
let inCriteria = false
let orderIndex = 0

for (const line of lines) {
    const taskMatch = line.match(/^###\s+[\d.]+\s+—\s+(.+?)\s+`\[W:(\d+)\]`\s+`\[TYPE:(\w+)\]`/)
    if (taskMatch) {
        if (current) tasks.push(current)
        const typeMap = {
            DESIGN: "design", TECH_INTEGRATE: "techIntegrate", BUSINESS: "business"
        }
        current = {
            title: taskMatch[1].trim(),
            description: "",
            type: typeMap[taskMatch[3]] || "business",
            weight: parseInt(taskMatch[2]),
            orderIndex: orderIndex++,
            criteria: []
        }
        inCriteria = false
        continue
    }

    if (!current) continue

    if (line.startsWith("**Criteria:**")) {
        inCriteria = true
        continue
    }

    if (line.startsWith("---") || line.startsWith("## ")) {
        inCriteria = false
        continue
    }

    if (inCriteria) {
        const cm = line.match(/^\d+\.\s+(.+)/)
        if (cm) {
            current.criteria.push({
                text: cm[1].trim(),
            })
        }
    } else if (!line.startsWith("#") && !line.startsWith(">") && line.trim()) {
        if (!current.description) current.description = line.trim()
        else current.description += " " + line.trim()
    }
}
if (current) tasks.push(current)

// Distribute TASK_TOTAL_SCORE across criteria (challenge-style rubric)
for (const t of tasks) {
    const n = t.criteria.length
    if (n === 0) continue
    const base = Math.floor(TASK_TOTAL_SCORE / n)
    const remainder = TASK_TOTAL_SCORE - base * n
    for (let i = 0; i < n; i++) {
        const c = t.criteria[i]
        c.score = i < remainder ? base + 1 : base
        c.orderIndex = i
        // Build challenge-style grading prompt
        c.promptText = `Grading rubric (max ${c.score}):\n\n`
            + `- Criterion (${c.score} point${c.score > 1 ? "s" : ""}): ${c.text}\n\n`
            + `Scoring rule: award full points only when the criterion is fully met with concrete evidence in the repository. Award 0 if not found or incomplete.`
    }
    t.maxScore = TASK_TOTAL_SCORE
}

// Split into batches and write
const totalBatches = Math.ceil(tasks.length / BATCH_SIZE)
for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchTasks = tasks.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)
    const batchDir = path.join(outputDir, String(batchIndex))
    fs.mkdirSync(batchDir, { recursive: true })

    // Write task data
    const mdLines = []
    for (let i = 0; i < batchTasks.length; i++) {
        const t = batchTasks[i]
        mdLines.push(`## ${i}`)
        mdLines.push(`### title`)
        mdLines.push(t.title)
        mdLines.push(`### description`)
        mdLines.push(t.description)
        mdLines.push(`### type`)
        mdLines.push(t.type)
        mdLines.push(`### weight`)
        mdLines.push(String(t.weight))
        mdLines.push(`### orderIndex`)
        mdLines.push(String(t.orderIndex))
        mdLines.push(`### maxScore`)
        mdLines.push(String(t.maxScore))
        for (let j = 0; j < t.criteria.length; j++) {
            const c = t.criteria[j]
            mdLines.push(`### criteria ${j}`)
            mdLines.push(`#### text`)
            mdLines.push(c.text)
            mdLines.push(`#### promptText`)
            mdLines.push(c.promptText)
            mdLines.push(`#### score`)
            mdLines.push(String(c.score))
            mdLines.push(`#### orderIndex`)
            mdLines.push(String(c.orderIndex))
        }
        mdLines.push("")
    }

    const outFile = path.join(batchDir, `${locale}.md`)
    fs.writeFileSync(outFile, mdLines.join("\n"))

    // Write table.md summary (only once per batch, using the first locale run)
    if (locale === "en") {
        const tableLines = [
            `# Batch ${batchIndex} — Tasks ${batchIndex * BATCH_SIZE}–${batchIndex * BATCH_SIZE + batchTasks.length - 1}`,
            "",
            "| # | Title | Type | Weight | Score | Criteria |",
            "|---|-------|------|--------|-------|----------|",
        ]
        for (const t of batchTasks) {
            tableLines.push(
                `| ${t.orderIndex} | ${t.title} | ${t.type} | ${t.weight} | ${t.maxScore} | ${t.criteria.length} |`
            )
        }
        tableLines.push("")
        fs.writeFileSync(path.join(batchDir, "table.md"), tableLines.join("\n"))
    }
}

console.log(`Generated ${tasks.length} tasks in ${totalBatches} batches (${TASK_TOTAL_SCORE}pts each) -> ${outputDir}/`)
