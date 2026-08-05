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
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"

@Injectable()
/**
 * Hits the locale-scoped content ES index (title / description / body) so lesson
 * and article hits appear in autocomplete without dumping them into the
 * course / module / challenge queries.
 */
export class ContentGlobalSearchService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly utilsService: GlobalSearchEntityUtilsService,
    ) {}

    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        const {
            term,
            size,
            locale,
        } = params
        const indexName = this.elasticsearch.indicateName({
            entity: ContentEntity.name,
            locale,
        })
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
                                    "body^1",
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
                    body: {
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
                "body",
            ],
        })

        return response.hits.hits.map((hit) => {
            const source = hit._source as Record<string, string | undefined> | undefined
            const texts = [
                ...(hit.highlight?.title ?? []),
                ...(hit.highlight?.description ?? []),
                ...(hit.highlight?.body ?? []),
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
                        ?? (source?.body as string | undefined)
                        ?? (source?.title as string | undefined)
                        ?? "",
                    )].map((text) => this.utilsService.cleanDisplayText(text)),
            }
        })
    }
}