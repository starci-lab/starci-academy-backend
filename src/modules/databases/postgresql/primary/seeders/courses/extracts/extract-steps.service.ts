import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractStepsParams,
    ExtractStepsResult,
    MarkdownStep,
} from "./types"

/**
 * Parses numbered `## N. Title` sections into structured steps.
 */
@Injectable()
export class ExtractStepsService {
    /**
     * @param param - Markdown block and optional `##` depth.
     * @returns Ordered step records with body text.
     */
    extract(
        {
            markdown,
            numHashs = 2,
        }: ExtractStepsParams,
    ): ExtractStepsResult {
        const lines = markdown.split("\n")
        const headingPrefix = "#".repeat(numHashs)
        const headingRegex = new RegExp(
            `^${headingPrefix}\\s+(\\d+)\\.\\s+(.*)$`,
        )

        const steps: Array<MarkdownStep> = []
        let inCodeBlock = false
        let currentStep: MarkdownStep | null = null
        let bodyLines: Array<string> = []

        for (const line of lines) {
            const trimmed = line.trim()

            if (trimmed.startsWith("```")) {
                inCodeBlock = !inCodeBlock
                if (currentStep) {
                    bodyLines.push(line)
                }
                continue
            }

            if (!inCodeBlock) {
                const match = trimmed.match(headingRegex)

                if (match) {
                    if (currentStep) {
                        currentStep.body = bodyLines.join("\n").trim()
                        steps.push(currentStep)
                    }

                    currentStep = {
                        index: Number(match[1]),
                        title: match[2].trim(),
                        body: "",
                    }
                    bodyLines = []
                    continue
                }
            }

            if (currentStep) {
                bodyLines.push(line)
            }
        }

        if (currentStep) {
            currentStep.body = bodyLines.join("\n").trim()
            steps.push(currentStep)
        }

        return steps
    }
}
