import type {
    FoundationEntity,
    Locale,
} from "@modules/databases"

/** Dual-locale markdown maps passed from {@link FoundationParserService}. */
export interface ParseFoundationTagsParams {
    jsonMap: Map<Locale, Partial<FoundationEntity>>
    categoryIndex: number
    foundationIndex: number
    foundationId: string
}

/** One raw foundation-tag item parsed from a mount `# tags` block (`## {index}` -> `### value`). */
export interface RawFoundationTagItem {
    /** The tag ordinal from `## {index}`. */
    orderIndex: number
    /** Optional explicit display-ordering index (falls back to orderIndex). */
    sortIndex?: number
    /** The tag value text from `### value`. */
    value?: string
}
