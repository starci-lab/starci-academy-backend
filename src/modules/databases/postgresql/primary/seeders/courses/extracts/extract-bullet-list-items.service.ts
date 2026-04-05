import {
    Injectable,
} from "@nestjs/common"
import type {
    ExtractBulletListItemsResult,
} from "./types"

/**
 * Collects top-level `- item` lines as plain text (strips the bullet prefix).
 */
@Injectable()
export class ExtractBulletListItemsService {
    /**
     * @param markdown - Block that may contain `-` list lines.
     * @returns Non-empty trimmed item texts in document order.
     */
    extract(
        markdown: string,
    ): ExtractBulletListItemsResult {
        const items: ExtractBulletListItemsResult = []
        let orderIndex = 0
        for (const line of markdown.split("\n")) {
            const trimmed = line.trim()
            if (/^-\s+/.test(trimmed)) {
                items.push({
                    text: trimmed.replace(
                        /^-\s+/,
                        "",
                    ).trim(),
                    orderIndex,
                })
                orderIndex++
            }
        }
        return items
    }
}
