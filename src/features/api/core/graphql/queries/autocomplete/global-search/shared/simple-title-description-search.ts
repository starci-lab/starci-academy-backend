import type {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import type {
    EntitySearchParams,
} from "../types/entity-search"
import type {
    GlobalSearchItem,
} from "../types/message"

/** Words kept on either side of the matched/center word in a snippet. */
const SNIPPET_WINDOW_WORDS = 4

/**
 * Build a short, match-centered snippet from a (possibly highlighted) text.
 * Identical regardless of which entity or fields produced the highlighted
 * text -- shared by every per-entity global-search service.
 * @param text - The raw or highlighted text.
 * @param windowWords - Words kept on either side of the matched/center word.
 * @returns A trimmed snippet windowed around the emphasized word.
 */
export const buildShortSnippet = (
    text: string,
    windowWords: number = SNIPPET_WINDOW_WORDS,
): string => {
    const normalized = (text ?? "").replace(
        /\s+/g,
        " ",
    ).trim()
    if (!normalized) {
        return "..."
    }
    const words = normalized.split(" ")
    const emphasizedWordIndex = words.findIndex((word) => /<em>.*<\/em>/i.test(word))
    const focusIndex = emphasizedWordIndex >= 0 ? emphasizedWordIndex : Math.floor(words.length / 2)
    const start = Math.max(
        0,
        focusIndex - windowWords,
    )
    const end = Math.min(
        words.length,
        focusIndex + windowWords + 1,
    )
    return `... ${words.slice(start,
        end).join(" ").trim()} ...`
}

/**
 * Run the "plain title + description" global-search shape shared by every
 * entity whose index maps `title` with as-you-type n-gram subfields and
 * searches nothing beyond title/description (course, module, ...). An entity
 * with EXTRA searched fields (e.g. content's `body`) or a plain,
 * non-n-gram `title` mapping (e.g. foundation's `match_phrase_prefix` shape)
 * is a genuinely different query shape and is NOT this one -- only the
 * byte-identical shape is shared here; do not widen this to "fix" an
 * unrelated entity's duplication without re-checking its index mapping.
 * @param elasticsearch - The Elasticsearch service.
 * @param entityName - The entity's `.name`, used to resolve the per-locale index.
 * @param params - The search term, page size, and locale.
 * @returns The matched hits as global search items.
 */
export const searchByTitleAndDescription = async (
    elasticsearch: ElasticsearchService,
    entityName: string,
    params: EntitySearchParams,
): Promise<Array<GlobalSearchItem>> => {
    const {
        term,
        size,
        locale,
    } = params
    /** The index name. */
    const indexName = elasticsearch.indicateName(
        {
            entity: entityName,
            locale,
        },
    )
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
                title: {
                    number_of_fragments: 1,
                    fragment_size: 220,
                },
                description: {
                    number_of_fragments: 1,
                    fragment_size: 220,
                },
            },
            pre_tags: ["<em>"],
            post_tags: ["</em>"],
        },
        _source: [
            "id",
            "displayId",
            "title",
            "description",
        ],
    })

    /** The global search items. */
    return response.hits.hits.map((hit) => {
        const source = hit._source as Record<string, string | undefined> | undefined
        const texts = [
            ...(hit.highlight?.title ?? []),
            ...(hit.highlight?.description ?? []),
        ].filter(Boolean).map((text) => buildShortSnippet(text as string))
        return {
            id: (source?.id as string | undefined) ?? hit._id ?? "",
            displayId: (source?.displayId as string | undefined) ?? "",
            title: (source?.title as string | undefined) ?? "",
            texts: texts.length
                ? texts.slice(
                    0,
                    3,
                )
                : [buildShortSnippet(
                    (source?.description as string | undefined)
                    ?? (source?.title as string | undefined)
                    ?? "",
                )],
        }
    })
}
