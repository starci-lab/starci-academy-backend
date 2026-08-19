import type {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import type {
    EntitySearchParams,
} from "../types/entity-search"
import type {
    GlobalSearchItem,
} from "../types/message"
import type {
    GlobalSearchEntityUtilsService,
} from "../entities/utils.service"

/** Highlight config shared by every field this template searches. */
const HIGHLIGHT_FIELD_CONFIG = {
    number_of_fragments: 1,
    fragment_size: 220,
} as const

/**
 * Per-entity variation over the shared "title + description (+ extras)"
 * Elasticsearch query shape. Only what genuinely differs between entities
 * lives here -- the query/highlight/mapping structure itself is fixed by
 * {@link searchEntityByFields}.
 */
export interface EntityFieldSearchConfig {
    /**
     * Extra field entries appended to the fuzzy `multi_match.fields` list,
     * written exactly as they should appear in that array (e.g. `"body^1"`,
     * `"prerequisites"`). Also drives the highlighted/`_source` field set --
     * the bare field name is derived by stripping any trailing `^boost`.
     */
    extraFields?: Array<string>
    /**
     * Bare field name (no boost suffix) tried between `description` and
     * `title` when nothing highlighted so a fallback snippet can still be
     * built. Hand-picked per entity -- not every extra field qualifies.
     */
    fallbackField?: string
}

/**
 * Run the Elasticsearch query/highlight/mapping template shared by every
 * per-entity global-search service in this handler: an as-you-type n-gram
 * prefix match plus a fuzzy `title`/`description`(+extras) match, matching
 * snippets built from highlights (or a hand-picked fallback field when
 * nothing highlighted). Entities differ only by which extra fields they
 * search/highlight and which field backs the fallback snippet -- both are
 * passed in as data via `config` rather than re-implemented per entity.
 * @param elasticsearch - The Elasticsearch service.
 * @param utilsService - The utils service used to clean and window snippet text.
 * @param entityName - The entity's `.name`, used to resolve the per-locale index.
 * @param params - The search term, page size, and locale.
 * @param config - The per-entity extra fields and fallback field.
 * @returns The matched hits as global search items.
 */
export const searchEntityByFields = async (
    elasticsearch: ElasticsearchService,
    utilsService: GlobalSearchEntityUtilsService,
    entityName: string,
    {
        term,
        size,
        locale,
    }: EntitySearchParams,
    {
        extraFields = [],
        fallbackField,
    }: EntityFieldSearchConfig = {
    },
): Promise<Array<GlobalSearchItem>> => {
    /** Bare field names (boost suffix stripped) for highlighting and `_source`. */
    const extraFieldNames = extraFields.map((field) => field.split("^")[0])
    /** The index name. */
    const indexName = elasticsearch.indicateName({
        entity: entityName,
        locale,
    })
    /** The response. */
    const response = await elasticsearch.client.search({
        index: indexName,
        size,
        query: {
            bool: {
                should: [
                    {
                        multi_match: {
                            query: term,
                            type: "bool_prefix",
                            fields: [
                                "title^4",
                                "title._2gram^3",
                                "title._3gram^2",
                            ],
                        },
                    },
                    {
                        multi_match: {
                            query: term,
                            fields: [
                                "title^3",
                                "description^2",
                                ...extraFields,
                            ],
                            fuzziness: "AUTO",
                            prefix_length: 1,
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        },
        highlight: {
            fields: {
                title: HIGHLIGHT_FIELD_CONFIG,
                description: HIGHLIGHT_FIELD_CONFIG,
                ...Object.fromEntries(extraFieldNames.map((name) => [name,
                    HIGHLIGHT_FIELD_CONFIG])),
            },
            pre_tags: ["<em>"],
            post_tags: ["</em>"],
        },
        _source: [
            "id",
            "displayId",
            "title",
            "description",
            ...extraFieldNames,
        ],
    })

    return response.hits.hits.map((hit) => {
        const source = hit._source as Record<string, string | undefined> | undefined
        const texts = [
            ...(hit.highlight?.title ?? []),
            ...(hit.highlight?.description ?? []),
            ...extraFieldNames.flatMap((name) => hit.highlight?.[name] ?? []),
        ].filter(Boolean).map((text) =>
            utilsService.cleanDisplayText(
                utilsService.buildShortSnippet(text as string),
            ))
        /** The hand-picked fallback text when nothing highlighted. */
        const fallbackText = (source?.description as string | undefined)
            ?? (fallbackField ? (source?.[fallbackField] as string | undefined) : undefined)
            ?? (source?.title as string | undefined)
            ?? ""

        return {
            id: (source?.id as string | undefined) ?? hit._id ?? "",
            displayId: (source?.displayId as string | undefined) ?? "",
            title: utilsService.cleanDisplayText((source?.title as string | undefined) ?? ""),
            texts: texts.length
                ? texts.slice(
                    0,
                    3,
                )
                : [utilsService.buildShortSnippet(fallbackText)].map((text) => utilsService.cleanDisplayText(text)),
        }
    })
}
