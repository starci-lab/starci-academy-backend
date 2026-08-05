/**
 * Copy an object's own enumerable fields onto a `Record<string, unknown>`.
 * Used at jsonb / webhook / SDK boundaries where a named interface is structurally
 * a bag of fields but lacks an index signature.
 */
export const toUnknownRecord = (value: object): Record<string, unknown> => {
    const out: Record<string, unknown> = {
    }
    for (const [
        key,
        field,
    ] of Object.entries(value)) {
        out[key] = field
    }
    return out
}

/**
 * Keep only plain-object entries from an unknown jsonb array (drop nulls / scalars / nested arrays).
 */
export const toUnknownRecordArray = (value: unknown): Array<Record<string, unknown>> => {
    if (!Array.isArray(value)) {
        return []
    }
    return value.filter((entry): entry is Record<string, unknown> => (
        typeof entry === "object"
        && entry !== null
        && !Array.isArray(entry)
    )).map((entry) => toUnknownRecord(entry))
}
