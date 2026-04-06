import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractSubmissionPromptsParams,
    ExtractSubmissionPromptsResult,
} from "./types"

/** One prompt row parsed from `### N. Title (Xpts)` under a submission block. */
export interface ExtractSubmissionPrompt {
    /** Line index of the prompt. */
    lineIndex: number
    /** Zero-based order, derived from the `N` in `### N.`. */
    orderIndex: number
    /** Score for the prompt. */
    score: number
    /** Title of the prompt. */
    title: string
}
/**
 * Parses `### N. Title (Xpts)` rubric blocks inside a challenge submission description.
 */
@Injectable()
export class ExtractSubmissionPromptsService {

    /**
     * @param param - Markdown body under a `## (Type) Title` submission heading.
     * @returns Prompt rows in document order.
     */
    extract(
        {
            markdown,
        }: ExtractSubmissionPromptsParams,
    ): ExtractSubmissionPromptsResult {
        const lines = markdown.split("\n")
        const headings: Array<ExtractSubmissionPrompt> = []
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim()
            const match = trimmed.startsWith("###")
            if (!match) {
                continue
            }
            headings.push(
                {
                    lineIndex: i,
                    orderIndex: Number(match[1]) - 1,
                    score: Number(match[3]),
                    title: match[2].trim(),
                },
            )
        }

        return headings.map(
            (
                heading,
                index,
            ) => {
                const bodyStart = heading.lineIndex + 1
                const bodyEnd = index + 1 < headings.length
                    ? headings[index + 1].lineIndex
                    : lines.length
                const text = lines
                    .slice(
                        bodyStart,
                        bodyEnd,
                    )
                    .join("\n")
                    .trim()
                return {
                    orderIndex: heading.orderIndex,
                    score: heading.score,
                    title: heading.title,
                    text,
                }
            },
        )
    }
}
