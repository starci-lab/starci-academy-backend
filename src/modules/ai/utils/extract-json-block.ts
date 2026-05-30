/**
 * Extract the JSON payload from a raw LLM response so `JSON.parse` succeeds even
 * when the model wraps it in a ```json fence or adds prose before/after.
 *
 * - Strips a single markdown code fence if present.
 * - Slices from the first `{`/`[` to its matching close bracket, skipping any
 *   surrounding text and correctly ignoring brackets that appear inside strings.
 *
 * @param raw - The raw model response text.
 * @returns The best-effort JSON substring (caller still runs `JSON.parse`).
 */
export const extractJsonBlock = (
    raw: string,
): string => {
    let text = raw.trim()

    // Unwrap a markdown code fence (```json ... ``` or ``` ... ```).
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) {
        text = fenceMatch[1].trim()
    }

    // Find the first opening bracket; if none, hand the text back unchanged.
    const start = text.search(/[{[]/)
    if (start === -1) {
        return text
    }

    const open = text[start]
    const close = open === "{" ? "}" : "]"
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < text.length; index++) {
        const char = text[index]
        if (inString) {
            if (escaped) {
                escaped = false
            } else if (char === "\\") {
                escaped = true
            } else if (char === "\"") {
                inString = false
            }
            continue
        }
        if (char === "\"") {
            inString = true
        } else if (char === open) {
            depth++
        } else if (char === close) {
            depth--
            if (depth === 0) {
                return text.slice(start,
                    index + 1)
            }
        }
    }

    // Unbalanced — return from the first bracket onward and let JSON.parse decide.
    return text.slice(start)
}
