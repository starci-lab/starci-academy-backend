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
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"

import {
    buildShortSnippet,
} from "../shared/simple-title-description-search"

@Injectable()
/**
 * Service for performing global search on milestones.
 *
 * Queries the per-locale `milestones-*` index whose `title` is a plain `text`
 * field, so it pairs a `match_phrase_prefix` (as-you-type prefixing) with a
 * fuzzy `multi_match` over `title`/`description`.
 */
export class MilestoneGlobalSearchService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Executes the milestone global search.
     * @param params - The search term, page size, and locale.
     * @returns The matched milestone hits as global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        const {
            term,
            size,
            locale,
        } = params
        // resolve the per-locale index (e.g. `milestones-en`)
        const indexName = this.elasticsearch.indicateName(
            {
                entity: MilestoneEntity.name,
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
}
