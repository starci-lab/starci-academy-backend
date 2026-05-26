import {
    Injectable,
} from "@nestjs/common"
import normalizeNewline from "normalize-newline"
import {
    MOUNT_SECTION_DELIMITER_LINE_RE,
} from "./mount-delimiter.constants"

interface DelimiterCut {
    content: string
    bounded: boolean
}

interface HeadingSlice {
    key: string
    body: string
}

/**
 * Mount markdown → JSON: recursive headings; delimiter cuts a trimmed string leaf.
 */
@Injectable()
export class ExtractJsonFromMdService {
    /**
     * Extracts a JSON object from a markdown string.
     */
    extract<T extends Record<string, unknown>>(markdown: string): T {
        if (!markdown) {
            return {
            } as T
        }

        const normalized = normalizeNewline(markdown.replace(/^\uFEFF/,
            ""))
        const result = this.parseAtLevel(normalized,
            1)

        if (typeof result === "object" && result !== null && !Array.isArray(result)) {
            return result as T
        }

        return {
            data: result,
        } as unknown as T
    }

    /**
     * Checks if a line is a delimiter line.
     */
    private isDelimiterLine(line: string): boolean {
        return MOUNT_SECTION_DELIMITER_LINE_RE.test(line)
    }

    /**
     * Cuts a delimiter bounded content from a section body.
     */
    private cutDelimiterBoundedContent(sectionBody: string): DelimiterCut {
        const lines = sectionBody.split("\n")
        const firstContentLineIndex = lines.findIndex((line) => line.trim().length > 0)

        if (
            firstContentLineIndex === -1
            || !this.isDelimiterLine(lines[firstContentLineIndex])
        ) {
            return {
                content: sectionBody.trim(),
                bounded: false,
            }
        }

        const delimiterIndices: Array<number> = []
        for (let index = 0; index < lines.length; index += 1) {
            if (this.isDelimiterLine(lines[index])) {
                delimiterIndices.push(index)
            }
        }

        const openIndex = delimiterIndices[0]
        const closeIndex =
            delimiterIndices.length > 1
                ? delimiterIndices[delimiterIndices.length - 1]
                : -1

        if (closeIndex > openIndex) {
            return {
                content: lines.slice(openIndex + 1,
                    closeIndex).join("\n").trim(),
                bounded: true,
            }
        }

        return {
            content: lines.slice(openIndex + 1).join("\n").trim(),
            bounded: true,
        }
    }

    /**
     * Collects headings from a markdown string.
     */
    private collectHeadings(
        content: string,
        level: number,
    ): Array<{ key: string; pos: number }> {
        const prefix = `${"#".repeat(level)} `
        const headings: Array<{ key: string; pos: number }> = []
        let inFence = false
        let inSeparatorBlock = false
        let pos = 0

        for (const line of content.split("\n")) {
            if (line.trim().startsWith("```")) {
                inFence = !inFence
            }
            if (!inFence && this.isDelimiterLine(line)) {
                inSeparatorBlock = !inSeparatorBlock
            }
            if (!inFence && !inSeparatorBlock && line.startsWith(prefix)) {
                headings.push({
                    key: line.slice(prefix.length).trim(),
                    pos,
                })
            }
            pos += line.length + 1
        }
        return headings
    }

    /**
     * Slices sections from a markdown string.
     */
    private sliceSections(content: string, level: number): Array<HeadingSlice> {
        const headings = this.collectHeadings(content,
            level)
        return headings.map((heading, index) => {
            const lineEnd = content.indexOf("\n",
                heading.pos)
            const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
            const bodyEnd =
                index + 1 < headings.length ? headings[index + 1].pos : content.length
            return {
                key: heading.key,
                body: content.slice(bodyStart,
                    bodyEnd),
            }
        })
    }

    /**
     * Parses a section body from a markdown string.
     */
    private parseSectionBody(sectionBody: string, level: number): unknown {
        const { content, bounded } = this.cutDelimiterBoundedContent(sectionBody)
        if (bounded) {
            return content
        }
        return this.parseAtLevel(content,
            level + 1)
    }

    private static readonly NUMERIC_SECTION_KEY_RE = /^\d+$/

    /**
     * Parses a content at a given level.
     */
    private parseAtLevel(
        content: string, 
        level: number
    ): unknown {
        const sections = this.sliceSections(
            content, 
            level,
        )

        if (sections.length === 0) {
            return content.trim()
        }

        const allNumeric = sections.every((section) =>
            ExtractJsonFromMdService.NUMERIC_SECTION_KEY_RE.test(section.key),
        )

        if (allNumeric) {
            return sections
                .map((section) => {
                    const orderIndex = Number.parseInt(
                        section.key, 
                        10,
                    )
                    const parsed = this.parseSectionBody(
                        section.body, 
                        level,
                    )
                    if (
                        typeof parsed === "object"
                        && parsed !== null
                        && !Array.isArray(parsed)
                    ) {
                        return {
                            ...(parsed as Record<string, unknown>),
                            orderIndex,
                        }
                    }
                    return {
                        orderIndex,
                        value: parsed,
                    }
                })
                .sort(
                    (left, right) =>
                        (left.orderIndex as number) - (right.orderIndex as number),
                )
        }

        const result: Record<string, unknown> = {
        }
        for (const section of sections) {
            result[section.key] = this.parseSectionBody(
                section.body, 
                level
            )
        }
        return result
    }
}
