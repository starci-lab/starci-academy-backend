import {
    estypes,
} from "@elastic/elasticsearch"
import type {
    Client,
} from "@elastic/elasticsearch"

/** Default number of autocomplete suggestions returned. */
export const DEFAULT_SUGGESTIONS_LIMIT = 8
/** Hard cap so a client cannot pull the whole index via a suggest endpoint. */
export const MAX_SUGGESTIONS_LIMIT = 20
/** Suggester name used in the ES request + response (single suggester per query). */
const SUGGESTER_NAME = "items"

/** The `completion`-type field value stored on an indexed document. */
export interface CompletionSuggestField {
    /** Input phrases the FST will autocomplete against (already clean). */
    input: Array<string>
    /** Ranking weight (higher = surfaced first). */
    weight: number
}

/** Params for {@link buildCompletionSuggest}. */
export interface BuildCompletionSuggestParams {
    /** One or more clean label strings to register as completion inputs. */
    inputs: Array<string>
    /** Ranking weight (defaults to 1; clamped to a positive integer). */
    weight?: number
}

/**
 * Build the `completion` field value for an ES document (used by sync builders).
 * Trims + drops empty inputs and normalizes the weight to a positive integer.
 *
 * @param params - inputs + optional weight
 * @returns the `{ input, weight }` completion field
 */
export const buildCompletionSuggest = (
    {
        inputs,
        weight = 1,
    }: BuildCompletionSuggestParams,
): CompletionSuggestField => ({
    input: inputs
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    weight: Math.max(1, Math.floor(weight)),
})

/** One resolved autocomplete suggestion. */
export interface SuggestionResult {
    /** Document id of the suggested entity. */
    id: string
    /** Clean label (the matched completion input). */
    label: string
}

/** Params for {@link runCompletionSuggest}. */
export interface RunCompletionSuggestParams {
    /** The ES client. */
    client: Client
    /** Target index (already locale-resolved). */
    index: string
    /** Typed prefix to autocomplete. */
    prefix: string
    /** Max suggestions to return (clamped). */
    limit: number
    /** Completion field name on the index (defaults to `suggest`). */
    field?: string
}

/**
 * Run an ES Completion Suggester query and map the options to `{ id, label }`.
 *
 * The completion option's `text` is the matched input (clean label) and `_id` is
 * the document id, so no post-processing is needed. Empty prefix → empty result.
 *
 * @param params - {@link RunCompletionSuggestParams}
 * @returns the suggestions, best (weighted) match first
 */
export const runCompletionSuggest = async (
    {
        client,
        index,
        prefix,
        limit,
        field = "suggest",
    }: RunCompletionSuggestParams,
): Promise<Array<SuggestionResult>> => {
    // guard: a blank prefix yields no suggestions
    const normalized = prefix.trim()
    if (!normalized) {
        return []
    }

    // FST-backed completion: ranked by weight, de-duplicated, typo-tolerant
    const response = await client.search({
        index,
        suggest: {
            [SUGGESTER_NAME]: {
                prefix: normalized,
                completion: {
                    field,
                    size: Math.min(MAX_SUGGESTIONS_LIMIT, Math.max(1, limit)),
                    skip_duplicates: true,
                    fuzzy: {
                        fuzziness: "AUTO",
                    },
                } as estypes.SearchCompletionSuggester,
            },
        },
        // we only need the id; the label is the suggest text
        _source: false,
    })

    // suggest[name] is an array (one entry per prefix); take the first entry's options
    const entries = response.suggest?.[SUGGESTER_NAME] ?? []
    const options = entries[0]?.options ?? []
    const optionList = (Array.isArray(options) ? options : [options]) as Array<{
        text: string
        _id?: string
    }>

    return optionList.map((option) => ({
        id: String(option._id ?? ""),
        label: option.text,
    }))
}
