/**
 * Infers a language tag from the first fenced code block in markdown.
 */
export const inferLangFromCodeFence = (markdown: string): string => {
    const match = /```([A-Za-z0-9_+-]+)?/.exec(markdown)
    const lang = match?.[1]?.trim().toLowerCase()
    return lang && lang.length > 0 ? lang : "text"
}
