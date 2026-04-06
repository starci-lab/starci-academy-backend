import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractReferencesParams,
    ExtractReferencesResult,
} from "./types"

/**
 * Parses `- Alias: URL` bullet lines into reference rows.
 */
@Injectable()
export class ExtractReferencesService {
    /**
     * @param param - Markdown containing bullet references.
     * @returns Ordered alias/url pairs.
     */
    extract(
        {
            markdown,
        }: ExtractReferencesParams,
    ): ExtractReferencesResult {
        const lines = markdown.split("\n")
        const results: ExtractReferencesResult = []
        let orderIndex = 0

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("-")) {
                continue
            }
            const match = trimmed.match(/^-\s*(.+?):\s*(.+)$/)
            if (!match) {
                continue
            }
            results.push({
                alias: match[1].trim(),
                url: match[2].trim(),
                orderIndex,
            })
            orderIndex++
        }

        return results
    }
}
