import {
    SubmissionType 
} from "../../../enums"

/**
 * Parameters for extracting a block from a markdown.
 */
export interface ExtractBlockParams {
    /**
     * The heading key to extract.
     * Example: "References"
     */
    key: string
    /**
     * The markdown to extract the block from.
     */
    markdown: string
    /**
     * The number of hash symbols to extract.
     */
    numHashs?: number
}
/**
 * Extract a block from the text to the next top-level heading (e.g. `# Something`).
 * Skip any headings within code blocks.
 * @param key - The heading key to extract.
 * @param markdown - The markdown to extract the block from.
 * @returns The extracted block.
 */
export const extractBlock = (
    {
        key,
        markdown,
        numHashs = 1,
    }: ExtractBlockParams,
): string => {
    // split the markdown into lines
    const lines = markdown.split("\n")

    // initialize the variables
    let inCodeBlock = false
    let startIndex = -1
    let endIndex = lines.length

    // iterate through the lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // toggle the code block
        if (line.trim().startsWith("```")) {
            inCodeBlock = !inCodeBlock
        }

        if (inCodeBlock) continue

        const trimmed = line.trim()

        // find the start point (skip the text line)
        if (startIndex === -1 && trimmed === `${"#".repeat(numHashs)} ${key}`) {
            startIndex = i + 1   // skip the header
            continue
        }

        // find the next top-level heading
        if (
            startIndex !== -1 &&
            i > startIndex &&
            /^#\s+/.test(trimmed)
        ) {
            endIndex = i
            break
        }
    }

    // if the start index is not found, return an empty string
    if (startIndex === -1) return ""

    // return the extracted block
    return lines
        .slice(
            startIndex,
            endIndex
        )
        .join("\n")
        .trim()
}

/**
 * Parameters for splitting markdown steps.
 */
export interface ExtractStepsParams {
    /**
     * The markdown to extract the steps from.
     */
    markdown: string
    /**
     * The number of hash symbols to extract the steps from.
     */
    numHashs?: number
}

/**
 * A step in the markdown.
 */
export interface MarkdownStep {
    /**
     * The index of the step.
     */
    index: number
    /**
     * The title of the step.
     */
    title: string
    /**
     * The body of the step.
     */
    body: string
}

/**
 * Extract steps from a markdown heading block.
 * - index
 * - title
 * - body
 */
export const extractSteps = (
    {
        markdown,
        numHashs = 2,
    }: ExtractStepsParams,
): Array<MarkdownStep> => {
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

        // Toggle code block state, but still keep the line in body if inside a section
        if (trimmed.startsWith("```")) {
            inCodeBlock = !inCodeBlock
            if (currentStep) {
                bodyLines.push(line)
            }
            continue
        }

        // Ignore headings inside code blocks
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


/**
 * Parameters for extracting key-value pairs from the markdown.
 */
export interface ExtractReferencesParams {
    /**
     * The markdown to extract references from.
     */
    markdown: string
}

/**
 * A key-value pair in the markdown.
 */
export interface MarkdownReference {
    /**
     * The alias of the reference.
     */
    alias: string
    /**
     * The URL of the reference.
     */
    url: string
    /**
     * The order index of the reference.
     */
    orderIndex: number
}

/**
 * Extract references from a markdown heading block.
 *
 * Example:
 * # References
 * - NestJS: https://docs.nestjs.com
 * - Postman: https://www.postman.com
 */
export const extractReferences = (
    {
        markdown,
    }: ExtractReferencesParams,
): Array<MarkdownReference> => {
    const lines = markdown.split("\n")
    const results: Array<MarkdownReference> = []
    let orderIndex = 0
    for (const line of lines) {
        const trimmed = line.trim()
        // only parse bullet list items
        if (!trimmed.startsWith("-")) continue
        // match the reference
        const match = trimmed.match(/^-\s*(.+?):\s*(.+)$/)
        // if the line is not a reference, continue
        if (!match) continue
        // add the reference to the results
        results.push({
            alias: match[1].trim(),
            url: match[2].trim(),
            orderIndex: orderIndex,
        })
        // increment the order index
        orderIndex++
    }

    return results
}


/**
 * A submission in the markdown.
 */
export interface MarkdownSubmission {
    /**
     * The type of the submission.
     */
    type: SubmissionType
    /**
     * The title of the submission.
     */
    title: string
    /**
     * The description of the submission.
     */
    description: string
    /**
     * The order index of the submission.
     */
    orderIndex: number
}

/**
 * Parameters for extracting submissions from a markdown heading block.
 */
export interface ExtractSubmissionsParams {
    /**
     * The markdown to extract submissions from.
     */
    markdown: string
}

/**
 * Extract submissions from a markdown heading block.
 *
 * Example:
 * # Submission
 * ## (GitHub) GitHub Repository URL
 * ## (Demo) Demo URL
 */
export const extractSubmissions = (
    {
        markdown,
    }: ExtractSubmissionsParams,
): Array<MarkdownSubmission> => {
    const lines = markdown.split("\n")
    const results: Array<MarkdownSubmission> = []

    let orderIndex = 0

    for (const line of lines) {
        const trimmed = line.trim()

        if (!trimmed.startsWith("##")) continue

        /**
         * Match:
         * ## (GitHub) GitHub Repository URL
         */
        const match = trimmed.match(/^##\s*\((.*?)\)\s*(.*)$/)

        if (!match) continue

        const rawType = match[1].toLowerCase()

        let type: SubmissionType = SubmissionType.GithubUrl

        if (rawType.includes("github")) {
            type = SubmissionType.GithubUrl
        } else if (rawType.includes("google docs")) {
            type = SubmissionType.GoogleDocsUrl
        }

        // lấy description bằng extractBlock
        const description = extractBlock({
            key: match[0].replace(/^##\s*/,
                ""),
            markdown,
            numHashs: 2,
        })

        results.push({
            type,
            title: match[2].trim(),
            description,
            orderIndex,
        })

        orderIndex++
    }

    return results
}