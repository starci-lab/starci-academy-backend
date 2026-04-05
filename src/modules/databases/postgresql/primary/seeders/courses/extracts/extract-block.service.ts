import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractBlockParams,
    ExtractBlockResult,
} from "./types"

/**
 * Slices markdown from the line after `#… key` until the next top-level `#` heading,
 * ignoring fenced code blocks.
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
        let inCodeBlock = false
        let startIndex = -1
        let endIndex = lines.length

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.trim().startsWith("```")) {
                inCodeBlock = !inCodeBlock
            }

            if (inCodeBlock) {
                continue
            }

            const trimmed = line.trim()

            if (startIndex === -1 && trimmed === `${"#".repeat(numHashs)} ${key}`) {
                startIndex = i + 1
                continue
            }

            if (
                startIndex !== -1 &&
                i > startIndex &&
                /^#\s+/.test(trimmed)
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
