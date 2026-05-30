/**
 * Helpers for SCHEMA V2 per-language bucket sections (`# requirements`, `# steps`, …).
 *
 * Mount format (flat delimiter blocks):
 * ```
 * ## 0
 * ### lang
 * <!-- @starci/seperator -->typescript<!-- @starci/seperator -->
 * ### data
 * #### 0
 * ##### title / body / score
 * ```
 *
 * Legacy jsonb blocks under `### data` still produce the same `data` array shape after extract.
 */

/** Reads a string field from a bucket item record. */
export const readLangBucketItemString = (
    record: Record<string, unknown> | undefined,
    key: string,
): string =>
    (record && typeof record[key] === "string" ? record[key] as string : "")

/** Finds the item with the given `orderIndex` inside a bucket's `data` array. */
export const findLangBucketItem = (
    bucket: Record<string, unknown> | undefined,
    itemIndex: number,
): Record<string, unknown> | undefined =>
    (Array.isArray(bucket?.data)
        ? (bucket?.data as Array<Record<string, unknown>>).find(
            (item) => item.orderIndex === itemIndex,
        )
        : undefined)

/** Returns ordered items from a language bucket's `data` array. */
export const getLangBucketDataItems = (
    bucket: Record<string, unknown> | undefined,
): Array<Record<string, unknown>> =>
    (Array.isArray(bucket?.data)
        ? (bucket?.data as Array<Record<string, unknown>>)
        : [])

/**
 * Keeps only valid language buckets (`lang` string + `data` array), ignoring leaked
 * heading keys from unbalanced delimiter markers in the mount.
 */
export const filterLangSectionBuckets = (
    section: unknown,
): Array<Record<string, unknown>> =>
    (Array.isArray(section)
        ? (section as Array<Record<string, unknown>>).filter(
            (bucket) => typeof bucket.lang === "string" && Array.isArray(bucket.data),
        )
        : [])

/** Coerces `score` from flat delimiter blocks (string) or legacy jsonb (number). */
export const readLangBucketItemScore = (
    record: Record<string, unknown> | undefined,
    toRequiredNumber: (value: unknown, fallback: number) => number,
): number => toRequiredNumber(record?.score,
    0)
