/**
 * Trim, drop empties, and preserve first-seen order for a key list.
 * @param keys - Raw key strings (may contain duplicates or whitespace).
 * @returns De-duplicated non-empty keys in stable order.
 */
export const dedupeNonEmptyKeys = (keys: Array<string>): Array<string> => {
    const seen = new Set<string>()
    const result: Array<string> = []

    for (const key of keys) {
        const trimmed = key.trim()
        if (!trimmed || seen.has(trimmed)) {
            continue
        }
        seen.add(trimmed)
        result.push(trimmed)
    }

    return result
}

/**
 * Last four characters of a key -- safe suffix for structured logs.
 * @param key - Full API key string.
 * @returns Four-char suffix, or the whole key when shorter than four chars.
 */
export const toKeySuffix = (key: string): string => {
    return key.length <= 4
        ? key
        : key.slice(-4)
}
