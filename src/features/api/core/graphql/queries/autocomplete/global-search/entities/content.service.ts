import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    EntitySearchParams,
    GlobalSearchItem,
} from "../types"
import {
    ContentEntity,
} from "@modules/databases"

@Injectable()
/**
 * Service for performing global search on content.
 */
export class ContentGlobalSearchService {
    /**
     * The number of words to include in the snippet.
     */
    private readonly snippetWindowWords = 4
    /**
     * Constructor.
     * @param elasticsearch - The Elasticsearch service.
     */

    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Executes the content global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        const { term, size, locale } = params
        /** The index name. */
        const indexName = this.elasticsearch.indicateName(
            {
                entity: ContentEntity.name,
                locale,
            },
        )
        /** The response. */
        const response = await this.elasticsearch.client.search({
            index: indexName,
            size,
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: term,
                                type: "bool_prefix",
                                fields: ["title^4",
                                    "title._2gram^3",
                                    "title._3gram^2"],
                            },
                        },
                        {
                            multi_match: {
                                query: term,
                                fields: ["title^3",
                                    "description^2",
                                    "body^1"],
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
                        number_of_fragments: 1, fragment_size: 220 
                    },
                    description: {
                        number_of_fragments: 1, fragment_size: 220 
                    },
                    body: {
                        number_of_fragments: 1, fragment_size: 220 
                    },
                },
                pre_tags: ["<em>"],
                post_tags: ["</em>"],
            },
            _source: ["id",
                "displayId",
                "title",
                "description",
                "body"],
        })

        /** The global search items. */
        return response.hits.hits.map((hit) => {
            const source = hit._source as Record<string, string | undefined> | undefined
            const texts = [
                ...(hit.highlight?.title ?? []),
                ...(hit.highlight?.description ?? []),
                ...(hit.highlight?.body ?? []),
            ].filter(Boolean).map((text) => this.buildShortSnippet(text as string))
            return {
                id: (source?.id as string | undefined) ?? hit._id ?? "",
                displayId: (source?.displayId as string | undefined) ?? "",
                title: (source?.title as string | undefined) ?? "",
                texts: texts.length ? texts.slice(0,
                    3) : [this.buildShortSnippet((source?.description as string | undefined) ?? (source?.body as string | undefined) ?? (source?.title as string | undefined) ?? "")],
            }
        })
    }

    /**
     * Builds a short snippet from a text.
     * @param text - The text.
     * @returns The short snippet.
     */
    private buildShortSnippet(text: string): string {
        const normalized = (text ?? "").replace(
            /\s+/g,
            " ",
        ).trim()
        if (!normalized) return "..."
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
