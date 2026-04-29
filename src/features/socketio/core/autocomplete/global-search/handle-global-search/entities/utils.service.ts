import {
    Injectable,
} from "@nestjs/common"
import removeMarkdown from "remove-markdown"

/**
 * Service for performing global search entity utils.
 */
@Injectable()
export class GlobalSearchEntityUtilsService {
    /**
     * The number of words to include in the snippet.
     */
    private readonly snippetWindowWords = 4

    /**
     * Cleans the display text.
     * @param text - The text.
     * @returns The cleaned text.
     */
    cleanDisplayText(text: string): string {
        return removeMarkdown(text ?? "")
            // highlight tags can split markdown tokens (e.g. **<em>ack</em>**)
            .replace(/(\*\*|__|~~|`{1,3})/g,
                "")
            .replace(/\*+(\s*<em>.*?<\/em>\s*)\*+/gi,
                "$1")
            .replace(/_+(\s*<em>.*?<\/em>\s*)_+/gi,
                "$1")
            .replace(/\\([\\`*_{}[\]()#+\-.!|>~])/g,
                "$1")
            .replace(/\s+/g,
                " ")
            .trim()
    }

    /**
     * Builds a short snippet from a text.
     * @param text - The text.
     * @returns The short snippet.
     */
    buildShortSnippet(text: string): string {
        const normalized = (text ?? "").replace(
            /\s+/g,
            " ",
        ).trim()
        if (!normalized) {
            return "..."
        }
        const words = normalized.split(" ")
        const emphasizedWordIndex = words.findIndex((word) => /<em>.*<\/em>/i.test(word))
        const focusIndex = emphasizedWordIndex >= 0 ? emphasizedWordIndex : Math.floor(words.length / 2)
        const start = Math.max(
            0,
            focusIndex - this.snippetWindowWords,
        )
        const end = Math.min(
            words.length,
            focusIndex + this.snippetWindowWords + 1,
        )
        return `... ${words.slice(
            start,
            end,
        ).join(" ").trim()} ...`
    }
}
