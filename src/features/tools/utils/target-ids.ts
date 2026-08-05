/**
 * Parse a multipart/form field into a list of target ids.
 *
 * Multipart bodies cannot carry a real array, so the dashboard sends the target
 * ids as a JSON string (e.g. `["a","b"]`). This also tolerates a comma-separated
 * string, a single id, or an already-parsed array.
 */
export const parseTargetIds = (raw: unknown): Array<string> => {
    // already an array (JSON body path)
    if (Array.isArray(raw)) {
        return raw.filter((x): x is string => typeof x === "string")
    }
    // string form (multipart path)
    if (typeof raw === "string") {
        const trimmed = raw.trim()
        if (!trimmed) {
            return []
        }
        // JSON array string -> parse
        if (trimmed.startsWith("[")) {
            try {
                const parsed = JSON.parse(trimmed)
                return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
            } catch {
                return []
            }
        }
        // fallback: comma-separated or single id
        return trimmed.split(",").map((x) => x.trim()).filter(Boolean)
    }
    return []
}
