import {
    Injectable 
} from "@nestjs/common"
import normalizeNewline from "normalize-newline"

const IDENT_RE = /^[a-zA-Z]\w*$/
const NUMERIC_HEADING_RE = /^(\d+)(?:[.)]\s+(.+))?$/ // Improved to capture description if exists
const RAW_BLOCK_KEYS = new Set([
    "body",
    "text",
    "hint"
])

@Injectable()
export class ExtractJsonFromMdService {
    extract<T extends Record<string, unknown>>(markdown: string): T {
        if (!markdown) return {
        } as T

        const normalizedMarkdown = normalizeNewline(markdown.replace(/^\uFEFF/,
            ""))
        
        // Start parsing at Level 1 (#)
        const result = this.parseAtLevel(normalizedMarkdown,
            1)

        if (typeof result === "object" && result !== null && !Array.isArray(result)) {
            return result as T
        }

        return {
            data: result 
        } as unknown as T
    }

    private withOrderIndex(parsed: unknown, orderIndex: number): unknown {
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return {
                ...(parsed as Record<string, unknown>),
                orderIndex,
            }
        }
        return {
            orderIndex,
            value: typeof parsed === "string" ? parsed.trim() : parsed,
        }
    }

    private collectHeadings(content: string, level: number) {
        const headingPrefix = `${"#".repeat(level)} `
        const headings: Array<{ key: string; pos: number }> = []
        let inFencedCodeBlock = false
        let currentPos = 0

        const lines = content.split("\n")
        for (const line of lines) {
            const trimmedLine = line.trim()

            if (trimmedLine.startsWith("```")) {
                inFencedCodeBlock = !inFencedCodeBlock
            }

            if (!inFencedCodeBlock && line.startsWith(headingPrefix)) {
                headings.push({
                    key: line.slice(headingPrefix.length).trim(),
                    pos: currentPos,
                })
            }
            currentPos += line.length + 1 // +1 for the \n
        }
        return headings
    }

    private parseAtLevel(content: string, level: number): unknown {
        const headings = this.collectHeadings(content,
            level)

        // Base case: No headings at this level
        if (headings.length === 0) {
            return content.trim()
        }

        const preamble = content.slice(0,
            headings[0].pos).trim()
        const sections = headings.map((h, i) => {
            const lineEnd = content.indexOf("\n",
                h.pos)
            const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
            const bodyEnd = i + 1 < headings.length ? headings[i + 1].pos : content.length
            return {
                key: h.key,
                body: content.slice(bodyStart,
                    bodyEnd),
            }
        })

        // Determine if we are building an Array or an Object
        const allNumeric = sections.every((s) => NUMERIC_HEADING_RE.test(s.key))

        if (allNumeric) {
            const result: Array<unknown> = []
            for (const s of sections) {
                const match = s.key.match(NUMERIC_HEADING_RE)
                const index = parseInt(match![1],
                    10)
                const parsed = this.parseAtLevel(s.body,
                    level + 1)
                
                // If there was text after the number (e.g. "## 1. Description")
                // we treat it as an object with a 'title' field
                const node = this.withOrderIndex(parsed,
                    index)
                if (match![2] && typeof node === "object") {
                    (node as any).title = match![2].trim()
                }
                
                result[index] = node
            }
            // Filter out empty slots if indices aren't sequential
            return result.filter(val => val !== undefined)
        }

        // Logic for Object construction
        const result: Record<string, unknown> = {
        }
        if (preamble) {
            result["__content__"] = preamble
        }

        for (const s of sections) {
            // Clean key to be a valid JS property name if it isn't one
            const cleanKey = IDENT_RE.test(s.key) ? s.key : s.key.replace(/\s+/g,
                "_")
            
            if (RAW_BLOCK_KEYS.has(cleanKey.toLowerCase())) {
                result[cleanKey] = s.body.trim()
            } else {
                result[cleanKey] = this.parseAtLevel(s.body,
                    level + 1)
            }
        }

        return result
    }
}
