import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractBlockParams,
    ExtractBlockResult,
} from "./types"

/**
 * Escapes regex special characters in plain text.
 */
const escapeRegex = (
    value: string,
): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g,
        "\\$&")
}

/**
 * Slices markdown from the line after `#… key` until the next heading
 * at the same or higher level, ignoring fenced code blocks.
 */
@Injectable()
export class ExtractBlockService {
    /**
     * @param param - Heading key, source markdown, optional hash depth.
     * @returns Trimmed section body or empty string.
     */
    extract(
        {
            key,
            markdown,
            numHashs = 1,
        }: ExtractBlockParams,
    ): ExtractBlockResult {
        const lines = markdown.split("\n")
        const headingRegex = new RegExp(
            `^#{${numHashs}}\\s+${escapeRegex(key)}\\s*$`,
        )
        const nextHeadingRegex = new RegExp(
            `^#{1,${numHashs}}\\s+`,
        )

        let inCodeBlock = false
        let startIndex = -1
        let endIndex = lines.length

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const trimmed = line.trim()

            if (trimmed.startsWith("```")) {
                inCodeBlock = !inCodeBlock
            }

            if (inCodeBlock) {
                continue
            }

            if (
                startIndex === -1 &&
                headingRegex.test(trimmed)
            ) {
                startIndex = i + 1
                continue
            }

            if (
                startIndex !== -1 &&
                i > startIndex &&
                nextHeadingRegex.test(trimmed)
            ) {
                endIndex = i
                break
            }
        }

        if (startIndex === -1) {
            return ""
        }

        return lines
            .slice(
                startIndex,
                endIndex,
            )
            .join("\n")
            .trim()
    }
}