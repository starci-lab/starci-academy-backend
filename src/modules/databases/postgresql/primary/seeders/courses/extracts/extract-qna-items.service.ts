import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractQnaItemsParams,
    ExtractQnaItemsResult,
    MarkdownQnaItem,
} from "./types"
import {
    ExtractBlockService,
} from "./extract-block.service"

/**
 * Parses `# Q&A` sections into ordered question/answer pairs.
 */
@Injectable()
export class ExtractQnaItemsService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
    ) {}

    /**
     * @param param - Full markdown; locates `# Q&A` then `## N.` items.
     * @returns Items sorted by `orderIndex`.
     */
    extract(
        {
            markdown,
        }: ExtractQnaItemsParams,
    ): ExtractQnaItemsResult {
        const lines = markdown.split("\n")
        const items: ExtractQnaItemsResult = []
        let current: MarkdownQnaItem | null = null
        const bodyLines: Array<string> = []

        const flush = () => {
            if (!current) {
                return
            }
            current.answer = bodyLines.join("\n").trim()
            items.push(current)
            current = null
            bodyLines.length = 0
        }

        for (const line of lines) {
            const trimmed = line.trim()
            const match = trimmed.match(
                /^##\s+(\d+)\.\s+(.*)$/,
            )
            if (match) {
                flush()
                current = {
                    orderIndex: Number(match[1]),
                    question: match[2].trim(),
                    answer: "",
                }
                continue
            }
            if (current) {
                bodyLines.push(line)
            }
        }
        flush()

        return items.sort(
            (
                a,
                b,
            ) => a.orderIndex - b.orderIndex,
        )
    }
}
