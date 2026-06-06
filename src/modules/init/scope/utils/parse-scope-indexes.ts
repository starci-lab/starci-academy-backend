import type {
    SeedScopeIndexes,
} from "@modules/filesystem"

/**
 * Expand one comma part into order indexes.
 *
 * - `"3"`    -> `[3]`
 * - `"1-5"`  -> `[1, 2, 3, 4, 5]` (inclusive; ignored when `from > to`)
 *
 * @param part - a single trimmed token from a range string
 * @returns the order indexes it expands to (empty when malformed)
 */
const expandRangePart = (part: string): Array<number> => {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
        const from = parseInt(rangeMatch[1],
            10)
        const to = parseInt(rangeMatch[2],
            10)
        if (from > to) {
            return []
        }
        const indexes: Array<number> = []
        for (let index = from; index <= to; index += 1) {
            indexes.push(index)
        }
        return indexes
    }
    const single = parseInt(part,
        10)
    return Number.isInteger(single) && String(single) === part ? [single] : []
}

/**
 * Parse a range string (`"1-5"`, `"0,2,4"`, mixed `"1-3,7"`) into a set.
 * `"all"` is handled by the caller; an empty / malformed string yields `Set()`.
 *
 * @param value - the raw string scope value
 * @returns allow-list set (empty = off)
 */
const parseRangeString = (value: string): Set<number> => {
    const indexes = new Set<number>()
    for (const part of value.split(",")) {
        const trimmed = part.trim()
        if (trimmed.length === 0) {
            continue
        }
        for (const index of expandRangePart(trimmed)) {
            indexes.add(index)
        }
    }
    return indexes
}

/**
 * Convert a `seed.yaml` scope value into a per-course order-index filter.
 *
 * - `"all"`              -> `null`    (unrestricted — include every item).
 * - `Array<number>`      -> `Set(n…)` (allow-list of `orderIndex` values).
 * - `string` range       -> `Set(n…)` (`"1-5"`, `"0,2,4"`, mixed `"1-3,7"`).
 * - `[]` / `""`          -> `Set()`   (disabled — include nothing).
 *
 * Any unrecognized scalar is treated as disabled (safe default).
 *
 * @param value - the raw `indexes` value from `seed.yaml`
 * @returns `null` (all) or a `Set` allow-list (empty = off)
 */
export const parseScopeIndexes = (
    value: SeedScopeIndexes,
): Set<number> | null => {
    if (value === "all") {
        return null
    }
    if (Array.isArray(value)) {
        const indexes = new Set<number>()
        for (const index of value) {
            if (Number.isInteger(index)) {
                indexes.add(index)
            }
        }
        return indexes
    }
    if (typeof value === "string") {
        return parseRangeString(value)
    }
    // a bare single number (e.g. `modules: 3`) — YAML parses it as a number,
    // not a string, so treat it as a one-item allow-list rather than "off".
    if (typeof value === "number" && Number.isInteger(value)) {
        return new Set<number>([value])
    }
    return new Set<number>()
}
