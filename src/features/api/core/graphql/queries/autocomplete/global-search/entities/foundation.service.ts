import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import type {
    EntitySearchParams,
} from "../types/entity-search"
import type {
    GlobalSearchItem,
} from "../types/message"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"

@Injectable()
/**
 * Service for performing global search on foundation items.
 *
 * Queries the per-locale `foundations-*` index whose `title` is a plain `text`
 * field, so it pairs a `match_phrase_prefix` (as-you-type prefixing) with a
 * fuzzy `multi_match` over `title`/`description`.
 */
export class FoundationGlobalSearchService {
    /** The number of words to include around the match in a snippet. */
    private readonly snippetWindowWords = 4

    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Executes the foundation global search.
     * @param params - The search term, page size, and locale.
     * @returns The matched foundation hits as global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        const {
            term,
            size,
            locale,
        } = params
        // resolve the per-locale index (e.g. `foundations-en`)
        const indexName = this.elasticsearch.indicateName(
            {
                entity: FoundationEntity.name,
                locale,
            },
        )
        // prefix match for as-you-type + fuzzy full-text fallback over title/description
        const response = await this.elasticsearch.client.search({
            index: indexName,
            size,
            query: {
                bool: {
                    should: [
                        {
                            match_phrase_prefix: {
                                title: {
                                    query: term,
                                    boost: 4,
                                },
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

        // map ES hits to the shared global-search item shape
        return response.hits.hits.map((hit) => {
            const source = hit._source as Record<string, string | undefined> | undefined
            const texts = [
                ...(hit.highlight?.title ?? []),
                ...(hit.highlight?.description ?? []),
            ].filter(Boolean).map((text) => this.buildShortSnippet(text as string))
            return {
                id: (source?.id as string | undefined) ?? hit._id ?? "",
                displayId: (source?.displayId as string | undefined) ?? "",
                title: (source?.title as string | undefined) ?? "",
                texts: texts.length
                    ? texts.slice(
                        0,
                        3,
                    )
                    : [this.buildShortSnippet(
                        (source?.description as string | undefined)
                        ?? (source?.title as string | undefined)
                        ?? "",
                    )],
            }
        })
    }

    /**
     * Builds a short, match-centered snippet from a (possibly highlighted) text.
     * @param text - The raw or highlighted text.
     * @returns A trimmed snippet windowed around the emphasized word.
     */
    private buildShortSnippet(text: string): string {
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
            focusIndex - this.snippetWindowWords,
        )
        const end = Math.min(
            words.length,
            focusIndex + this.snippetWindowWords + 1,
        )
        return `... ${words.slice(start,
            end).join(" ").trim()} ...`
    }
}
