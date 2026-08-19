import type {
    ConsumeStringCharResult,
} from "../types/extract-json-block"

/**
 * Advance the in-string escape state for one character while scanning inside a
 * JSON string literal. Mirrors a single step of the bracket scanner's original
 * inline `if (escaped) ... else if (char === "\\") ... else if (char === "\"")`
 * chain, extracted so the scanner's own nesting stays shallow.
 *
 * @param char - The current character.
 * @param escaped - Whether the previous character was an unescaped backslash.
 * @returns The escape state for the NEXT character, and whether this character closes the string.
 */
const consumeStringChar = (
    char: string,
    escaped: boolean,
): ConsumeStringCharResult => {
    if (escaped) {
        return {
            escaped: false,
            closed: false,
        }
    }
    if (char === "\\") {
        return {
            escaped: true,
            closed: false,
        }
    }
    return {
        escaped: false,
        closed: char === "\"",
    }
}

/**
 * Update bracket depth for one character, outside a string. `null` means the
 * character is neither the open nor the close bracket (depth unchanged).
 */
const advanceBracketDepth = (
    char: string,
    open: string,
    close: string,
    depth: number,
): number | null => {
    if (char === open) {
        return depth + 1
    }
    if (char === close) {
        return depth - 1
    }
    return null
}

/**
 * Scan `text` from `start` for the index of the bracket that closes the one at
 * `start`, correctly ignoring brackets that appear inside JSON strings.
 *
 * @param text - The text to scan.
 * @param start - Index of the opening bracket.
 * @param open - The opening bracket character (`"{"` or `"["`).
 * @param close - The matching closing bracket character.
 * @returns The index of the matching close bracket, or `-1` when unbalanced.
 */
const findMatchingBracketEnd = (
    text: string,
    start: number,
    open: string,
    close: string,
): number => {
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < text.length; index++) {
        const char = text[index]
        if (inString) {
            const result = consumeStringChar(char,
                escaped)
            escaped = result.escaped
            if (result.closed) {
                inString = false
            }
            continue
        }
        if (char === "\"") {
            inString = true
            continue
        }
        const nextDepth = advanceBracketDepth(char,
            open,
            close,
            depth)
        if (nextDepth !== null) {
            depth = nextDepth
            if (depth === 0) {
                return index
            }
        }
    }
    return -1
}

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
    // No leading \s* before the capture: it would overlap with [\s\S]*? and cause
    // super-linear backtracking. Leading/trailing whitespace is stripped by the
    // .trim() below instead, so behavior is unchanged.
    const fenceMatch = /```(?:json)?([\s\S]*?)```/i.exec(text)
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
    const end = findMatchingBracketEnd(text,
        start,
        open,
        close)
    if (end === -1) {
        // Unbalanced -- return from the first bracket onward and let JSON.parse decide.
        return text.slice(start)
    }
    return text.slice(start,
        end + 1)
}
