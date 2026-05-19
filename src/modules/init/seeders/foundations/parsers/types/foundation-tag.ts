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
