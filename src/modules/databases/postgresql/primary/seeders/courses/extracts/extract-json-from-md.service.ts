import {
    Injectable,
} from "@nestjs/common"

const IDENT_RE = /^[a-zA-Z]\w*$/

/**
 * Recursively parses a heading-based markdown file into a nested JSON object.
 *
 * Convention:
 * - `# key` (level 1) → top-level object keys
 * - `## 0`, `## 1` … (numeric headings) → array items; each item includes **`orderIndex`** equal to that number (merged into objects, or wrapped for string leaves)
 * - `### key` (identifier headings) → nested object keys
 * - Repeats for deeper levels (`####`, `#####`, …)
 *
 * A section is treated as a leaf (raw string) when:
 * - It has no sub-headings, or
 * - Sub-headings are neither all-numeric nor all-identifier, or
 * - There is non-whitespace text before the first sub-heading (markdown body content)
 */
@Injectable()
export class ExtractJsonFromMdService {
    /**
     * Extracts a JSON object from a markdown string.
     * @param markdown - The markdown string to extract from.
     * @returns The extracted JSON object.
     */
    extract<T extends Record<string, unknown>>(
        markdown: string,
    ): T {
        const result = this.parseAtLevel(
            markdown,
            1,
        )
        if (
            typeof result === "object" &&
            result !== null &&
            !Array.isArray(result)
        ) {
            return result as T
        }
        return {
        } as T
    }

    /**
     * Attaches **orderIndex** from the numeric heading (`## n`, `#### n`, …) to the parsed node.
     */
    private withOrderIndex(
        parsed: unknown,
        orderIndex: number,
    ): unknown {
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
        ) {
            return {
                ...(parsed as Record<string, unknown>),
                orderIndex,
            }
        }
        if (typeof parsed === "string") {
            return {
                orderIndex,
                text: parsed.trim(),
            }
        }
        return {
            orderIndex,
            value: parsed,
        }
    }

    /**
     * Parses a markdown string at a given level.
     * @param content - The markdown string to parse.
     * @param level - The level to parse at.
     * @returns The parsed content.
     */
    private parseAtLevel(
        content: string,
        level: number,
    ): unknown {
        const regex = new RegExp(
            `^${"#".repeat(level)} (.+)$`,
            "gm",
        )

        const headings: Array<{
            key: string
            pos: number
        }> = []

        let match: RegExpExecArray | null
        while ((match = regex.exec(content)) !== null) {
            headings.push({
                key: match[1].trim(),
                pos: match.index,
            })
        }

        if (headings.length === 0) {
            return content.trim()
        }

        const preamble = content
            .slice(
                0,
                headings[0].pos,
            )
            .trim()

        const sections = headings.map(
            (
                h,
                i,
            ) => {
                const lineEnd = content.indexOf(
                    "\n",
                    h.pos,
                )
                const bodyStart =
                    lineEnd === -1
                        ? content.length
                        : lineEnd + 1
                const bodyEnd =
                    i + 1 < headings.length
                        ? headings[i + 1].pos
                        : content.length
                return {
                    key: h.key,
                    body: content.slice(
                        bodyStart,
                        bodyEnd,
                    ),
                }
            },
        )

        const allNumeric = sections.every(s =>
            /^\d+$/.test(s.key),
        )

        if (allNumeric) {
            const result: Array<unknown> = []
            for (const s of sections) {
                const orderIndex = parseInt(
                    s.key,
                    10,
                )
                const parsed = this.parseAtLevel(
                    s.body,
                    level + 1,
                )
                result[orderIndex] = this.withOrderIndex(
                    parsed,
                    orderIndex,
                )
            }
            return result
        }

        const allIdent = sections.every(s =>
            IDENT_RE.test(s.key),
        )

        if (allIdent && !preamble) {
            const result: Record<string, unknown> = {
            }
            for (const s of sections) {
                result[s.key] = this.parseAtLevel(
                    s.body,
                    level + 1,
                )
            }
            return result
        }

        return content.trim()
    }
}
