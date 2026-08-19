import type {
    MessageContent,
} from "@langchain/core/messages"

/**
 * Pull the plain text out of a LangChain message's `content`.
 *
 * `content` is a plain string for ordinary chat completions, but some
 * providers return an array of content blocks instead (`{ type: "text",
 * text: "..." }`, image blocks, reasoning blocks, ...). Blindly `String()`-ing
 * that array collapses every block to the literal `"[object Object]"`, which
 * would then be billed, persisted and shown to the learner as the AI's
 * answer. Join just the text blocks instead; non-text blocks contribute
 * nothing (there is no text to extract from an image block).
 *
 * @param content - The `content` field off an `AIMessage` / `AIMessageChunk`.
 * @returns The concatenated text, or `""` when no text block is present.
 */
export const extractMessageText = (content: MessageContent): string => {
    if (typeof content === "string") {
        return content
    }
    return content
        .map((part) => {
            if (
                typeof part === "object" &&
                part !== null &&
                "type" in part &&
                part.type === "text" &&
                "text" in part &&
                typeof part.text === "string"
            ) {
                return part.text
            }
            return ""
        })
        .join("")
}
