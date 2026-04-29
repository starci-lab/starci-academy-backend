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
    ChallengeEntity,
} from "@modules/databases"
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"

/**
 * Service for performing global search on challenges.
 */
@Injectable()
export class ChallengeGlobalSearchService {
    /**
     * Constructor.
     * @param elasticsearch - The Elasticsearch service.
     * @param utilsService - The utils service.
     */
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly utilsService: GlobalSearchEntityUtilsService,
    ) {}

    /**
     * Executes the challenge global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        {
            term,
            size,
            locale,
        }: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        /** The index name. */
        const indexName = this.elasticsearch.indicateName({
            entity: ChallengeEntity.name,
            locale,
        })
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
                                    "prerequisites",
                                    "requirements",
                                    "hint",
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
                    prerequisites: {
                        number_of_fragments: 1,
                        fragment_size: 220,
                    },
                    requirements: {
                        number_of_fragments: 1,
                        fragment_size: 220,
                    },
                    hint: {
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
                "prerequisites",
                "requirements",
                "hint",
            ],
        })

        return response.hits.hits.map((hit) => {
            const source = hit._source as Record<string, string | undefined> | undefined
            const texts = [
                ...(hit.highlight?.title ?? []),
                ...(hit.highlight?.description ?? []),
                ...(hit.highlight?.prerequisites ?? []),
                ...(hit.highlight?.requirements ?? []),
                ...(hit.highlight?.hint ?? []),
            ].filter(Boolean).map((text) =>
                this.utilsService.cleanDisplayText(
                    this.utilsService.buildShortSnippet(text as string),
                ))

            return {
                id: (source?.id as string | undefined) ?? hit._id ?? "",
                displayId: (source?.displayId as string | undefined) ?? "",
                title: this.utilsService.cleanDisplayText((source?.title as string | undefined) ?? ""),
                texts: texts.length
                    ? texts.slice(
                        0,
                        3,
                    )
                    : [this.utilsService.buildShortSnippet(
                        (source?.description as string | undefined)
                        ?? (source?.requirements as string | undefined)
                        ?? (source?.title as string | undefined)
                        ?? "",
                    )].map((text) => this.utilsService.cleanDisplayText(text)),
            }
        })
    }
}