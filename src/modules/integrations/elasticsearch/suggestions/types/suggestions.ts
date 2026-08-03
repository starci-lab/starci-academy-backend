import type {
    Locale,
} from "@modules/databases"

/** Prefix + optional limit a suggest query carries (mirrors `SuggestionsRequest`). */
export interface SuggestionsRequestShape {
    /** The typed prefix to autocomplete. */
    query: string
    /** Max suggestions to return (clamped by the handler). */
    limit?: number
}

/** The `params` shape every suggest query passes to a suggestions handler. */
export interface SuggestionsQueryParams {
    /** Locale used to resolve the per-locale ES index. */
    locale?: Locale
    /** The prefix + limit request payload. */
    request: SuggestionsRequestShape
}

/** A query object consumed by {@link AbstractSuggestionsHandler}. */
export interface SuggestionsQuery {
    /** Locale + request payload carried by the query. */
    params: SuggestionsQueryParams
}

/** One resolved autocomplete suggestion (compatible with `SuggestionsPayload.data`). */
export interface SuggestionItemShape {
    /** Document id of the suggested entity. */
    id: string
    /** Clean label (the matched completion input). */
    label: string
}

/** Plain payload shape returned by a suggestions handler (compatible with `SuggestionsPayload`). */
export interface SuggestionsPayloadShape {
    /** The matching suggestions, best (weighted) match first. */
    data: Array<SuggestionItemShape>
}
