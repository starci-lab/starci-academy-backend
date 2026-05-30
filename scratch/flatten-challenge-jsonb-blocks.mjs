import fs from "fs/promises"
import path from "path"
import normalizeNewline from "normalize-newline"

const SEP = "<!-- @starci/seperator -->"

/**
 * Converts one inline jsonb blob into nested `### data` → `#### item` → `##### field` blocks.
 */
function flattenJsonbBlock(block) {
    const lines = block.replace(/\r\n/g, "\n").split("\n")
    const result = []
    let index = 0
    while (index < lines.length) {
        const line = lines[index]
        const itemMatch = /^# (\d+)$/.exec(line.trim())
        if (itemMatch) {
            result.push(`#### ${itemMatch[1]}`)
            index += 1
            continue
        }
        const fieldMatch = /^## (title|body|score)$/.exec(line.trim())
        if (fieldMatch) {
            const field = fieldMatch[1]
            result.push(`##### ${field}`)
            index += 1
            const contentLines = []
            while (index < lines.length) {
                const next = lines[index]
                const trimmed = next.trim()
                if (/^# \d+$/.test(trimmed) || /^## (title|body|score)$/.test(trimmed)) {
                    break
                }
                contentLines.push(next)
                index += 1
            }
            const content = contentLines.join("\n").trim()
            result.push(SEP)
            result.push(content)
            result.push(SEP)
            continue
        }
        index += 1
    }
    return result.join("\n")
}

/**
 * Removes empty separator wrappers immediately after `### data`.
 */
function cleanupDataSection(markdown) {
    return markdown.replace(
        /(### data\n)<!-- @starci\/seperator -->\n(?=####)/g,
        "$1",
    )
}

function convertMarkdown(markdown) {
    const normalized = normalizeNewline(markdown)
    const converted = normalized.replace(
        /<!-- @starci\/jsonb -->\n([\s\S]*?)\n<!-- @starci\/jsonb -->/g,
        (_, block) => flattenJsonbBlock(block),
    )
    return cleanupDataSection(converted).trimEnd() + "\n"
}

async function main() {
    const targets = process.argv.slice(2)
    if (targets.length === 0) {
        throw new Error("Pass one or more challenge markdown paths")
    }
    for (const target of targets) {
        const absolutePath = path.resolve(target)
        const source = await fs.readFile(absolutePath, "utf8")
        const output = convertMarkdown(source)
        await fs.writeFile(absolutePath, output, "utf8")
        console.log(`flattened ${absolutePath}`)
    }
}

await main()
