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

/** One translation row attached by {@link MergeJsonService} on a lang-bucket `data[]` item. */
export interface LangBucketDataItemTranslationRow {
    /** Locale of the translated value. */
    locale: string
    /** Field name on the data item (`title`, `body`, …). */
    field: string
    /** Translated scalar. */
    value: string
}

/** Params for transposing a merged lang-bucket section into V2 item rows. */
export interface MapMergedLangBucketSectionParams {
    /** Merged section value (`merged.requirements`, `merged.steps`, …). */
    section: unknown
    /** When true, maps agnostic `title` rows on the parent item. */
    hasTitle: boolean
    /** When true, reads `score` from each per-lang data item. */
    hasScore: boolean
    /** Coerces numeric mount scalars (e.g. score). */
    toRequiredNumber: (value: unknown, fallback: number) => number
}

/**
 * Transposes merged lang buckets (`{ lang, data[] }` per row) into one V2 item per
 * `data[]` position with `langs` and optional title/body translation rows.
 *
 * @param params - Merged section + field flags.
 * @returns Item-shaped records (`orderIndex`, `langs`, optional `translations`).
 */
export const mapMergedLangBucketSection = (
    {
        section,
        hasTitle,
        hasScore,
        toRequiredNumber,
    }: MapMergedLangBucketSectionParams,
): Array<Record<string, unknown>> => {
    const buckets = filterLangSectionBuckets(section)
    const anchorItems = getLangBucketDataItems(buckets[0])
    return anchorItems.map((anchorItem) => {
        const orderIndex = typeof anchorItem.orderIndex === "number"
            ? anchorItem.orderIndex
            : 0
        const titleTranslationRows = hasTitle
            ? ((anchorItem.translations ?? []) as Array<LangBucketDataItemTranslationRow>)
                .filter((row) => row.field === "title")
            : []
        const langs = buckets.map((bucket) => {
            const lang = typeof bucket.lang === "string" ? bucket.lang : "text"
            const item = findLangBucketItem(bucket,
                orderIndex)
            const bodyTranslationRows = ((item?.translations ?? []) as Array<LangBucketDataItemTranslationRow>)
                .filter((row) => row.field === "body")
            return {
                lang,
                ...(hasScore
                    ? {
                        score: readLangBucketItemScore(
                            item,
                            toRequiredNumber,
                        ),
                    }
                    : {
                    }),
                translations: bodyTranslationRows.map((row) => ({
                    locale: row.locale,
                    body: row.value,
                })),
            }
        })
        return {
            orderIndex,
            ...(titleTranslationRows.length > 0
                ? {
                    translations: titleTranslationRows.map((row) => ({
                        locale: row.locale,
                        title: row.value,
                    })),
                }
                : {
                }),
            langs,
        }
    })
}
