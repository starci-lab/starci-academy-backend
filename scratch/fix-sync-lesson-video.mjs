import fs from "fs"

const files = [
    "src/modules/init/synchronizers/cdn-synchronizer/cdn-synchronizer.service.ts",
    "src/modules/init/synchronizers/indexer-synchronizer/indexer-synchronizer.service.ts",
    "src/modules/init/synchronizers/elasticsearch-synchronizer/elasticsearch-synchronizer.service.ts",
    "src/features/synchronizer/core/cdn-synchronizer/cdn-synchronizer.service.ts",
    "src/features/synchronizer/core/indexer-synchronizer/indexer-synchronizer.service.ts",
    "src/features/synchronizer/core/elasticsearch-synchronizer/elasticsearch-synchronizer.service.ts",
    "src/features/synchronizer/processors/sync-cdn/steps/process-cdn-entity-step.service.ts",
    "src/features/synchronizer/processors/sync-indexer/steps/process-build-parent-index.service.ts",
    "src/features/synchronizer/processors/sync-elasticsearch/steps/process-sync-elasticsearch-entity-step.service.ts",
]

function removeCaseBlock(source, entityCase) {
    const marker = `case ${entityCase}:`
    let idx = source.indexOf(marker)
    if (idx === -1) return source

    const braceStart = source.indexOf("{", idx)
    let depth = 0
    let i = braceStart
    for (; i < source.length; i++) {
        const ch = source[i]
        if (ch === "{") depth++
        else if (ch === "}") {
            depth--
            if (depth === 0) {
                i++
                break
            }
        }
    }
    // include trailing break if present
    const after = source.slice(i).match(/^\s*break\s*\n\s*\}/)
    const end = after ? i + after[0].length : i
    return source.slice(0, idx) + source.slice(end)
}

for (const file of files) {
    let c = fs.readFileSync(file, "utf8")
    c = removeCaseBlock(c, "LessonVideoEntity.name")

    c = c.replace(/^\s*LessonVideoEntity,?\s*\n/gm, "")
    c = c.replace(/,\s*\n\s*LessonVideoEntity/g, "")
    c = c.replace(/LessonVideoEntity,\s*/g, "")

    c = c.replace(/\n\s*[A-Za-z]*LessonVideo[A-Za-z]*(Build)?Service,?\s*\n/g, "\n")
    c = c.replace(/\n\s*private readonly [A-Za-z]*LessonVideo[A-Za-z]*Service[^;]*;\s*\n/g, "\n")

    c = c.replace(/\n\s*LessonVideoEntity\.name,?\s*\n/g, "\n")

    c = c.replace(/,?\s*shouldSyncLessonVideoEntity/g, "")

    fs.writeFileSync(file, c)
    console.log("fixed", file)
}
