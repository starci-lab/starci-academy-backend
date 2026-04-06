import {
    Injectable,
} from "@nestjs/common"
import {
    SubmissionType,
} from "../../../enums"
import type {
    ExtractSubmissionsParams,
    ExtractSubmissionsResult,
    MarkdownSubmissionPrompt,
} from "./types"
import {
    ExtractBlockService,
} from "./extract-block.service"

const PROMPT_HEADING = /^###\s+(\d+)\.\s+(.+)$/

/**
 * Parses `## (GitHub|Google Docs) Title` headings into submission descriptors,
 * including rubric blocks `### N. Title (Xpts)` under each submission.
 */
@Injectable()
export class ExtractSubmissionsService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
    ) {}

    /**
     * @param param - Markdown containing submission subheadings.
     * @returns Typed submission rows: intro text in `description`, rubric in `prompts`.
     */
    extract(
        {
            markdown,
        }: ExtractSubmissionsParams,
    ): ExtractSubmissionsResult {
        const lines = markdown.split("\n")
        const results: ExtractSubmissionsResult = []
        let orderIndex = 0

        for (const line of lines) {
            const trimmed = line.trim()

            if (!trimmed.startsWith("##")) {
                continue
            }

            const match = trimmed.match(/^##\s*\((.*?)\)\s*(.*)$/)

            if (!match) {
                continue
            }

            const rawType = match[1].toLowerCase()

            let type: SubmissionType = SubmissionType.GithubUrl

            if (rawType.includes("github")) {
                type = SubmissionType.GithubUrl
            } else if (rawType.includes("google docs")) {
                type = SubmissionType.GoogleDocsUrl
            }

            const fullBody = this.extractBlockService.extract({
                key: match[0].replace(
                    /^##\s*/,
                    "",
                ),
                markdown,
                numHashs: 2,
            })

            const {
                description,
                prompts,
            } = this.splitSubmissionBody(fullBody)

            results.push({
                type,
                title: match[2].trim(),
                description,
                orderIndex,
                prompts,
            })
            orderIndex++
        }
        return results
    }

    /**
     * Text before the first `### N.` heading becomes `description`; each `###` block becomes a prompt.
     */
    private splitSubmissionBody(
        markdown: string,
    ): {
        description: string
        prompts: Array<MarkdownSubmissionPrompt>
    } {
        const lines = markdown.split("\n")
        const prompts: Array<MarkdownSubmissionPrompt> = []
        let inCodeBlock = false
        const introLines: Array<string> = []
        let current: MarkdownSubmissionPrompt | null = null
        let bodyLines: Array<string> = []
        let sawPrompt = false

        const flushPrompt = () => {
            if (current) {
                current.text = bodyLines.join("\n").trim()
                prompts.push(current)
                current = null
                bodyLines = []
            }
        }

        for (const line of lines) {
            const trimmed = line.trim()

            if (trimmed.startsWith("```")) {
                inCodeBlock = !inCodeBlock
                if (sawPrompt && current) {
                    bodyLines.push(line)
                } else if (!sawPrompt) {
                    introLines.push(line)
                }
                continue
            }

            if (!inCodeBlock) {
                const headingMatch = trimmed.match(PROMPT_HEADING)

                if (headingMatch) {
                    sawPrompt = true
                    flushPrompt()
                    const {
                        title,
                        score,
                    } = this.parsePromptTitleAndScore(headingMatch[2])
                    current = {
                        orderIndex: Number(headingMatch[1]) - 1,
                        score,
                        title,
                        text: "",
                    }
                    continue
                }
            }

            if (sawPrompt && current) {
                bodyLines.push(line)
            } else {
                introLines.push(line)
            }
        }

        flushPrompt()

        return {
            description: introLines.join("\n").trim(),
            prompts,
        }
    }

    private parsePromptTitleAndScore(
        rest: string,
    ): {
        title: string
        score: number
    } {
        const scoreMatch = rest.match(/^(.+?)\s*\((\d+)\s*pts\)\s*$/i)

        if (scoreMatch) {
            return {
                title: scoreMatch[1].trim(),
                score: Number(scoreMatch[2]),
            }
        }

        return {
            title: rest.trim(),
            score: 0,
        }
    }
}
