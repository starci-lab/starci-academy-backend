import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CacheKey,
    CacheService,
    ParentIndexCacheResult,
} from "@modules/cache"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    Locale,
    ModuleEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    estypes,
} from "@elastic/elasticsearch"
import {
    IndexSearchQuery,
} from "./index-search.query"
import {
    IndexSearchData,
    IndexSearchItem,
    IndexSearchParentPath,
    IndexSearchType,
} from "./graphql-types"
import type {
    IndexSearchCatalogEntry,
    IndexSearchHitSource,
} from "./types"

const INDEX_MAP: Record<IndexSearchType, IndexSearchCatalogEntry> = {
    [IndexSearchType.CourseIndex]: {
        index: "courses",
        entityName: CourseEntity.name,
    },
    [IndexSearchType.ModuleIndex]: {
        index: "modules",
        entityName: ModuleEntity.name,
    },
    [IndexSearchType.ContentIndex]: {
        index: "contents",
        entityName: ContentEntity.name,
    },
    [IndexSearchType.ChallengeIndex]: {
        index: "challenges",
        entityName: ChallengeEntity.name,
    },
}

@QueryHandler(IndexSearchQuery)
@Injectable()
export class IndexSearchHandler
    extends ICQRSHandler<IndexSearchQuery, IndexSearchData>
    implements IQueryHandler<IndexSearchQuery, IndexSearchData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly cacheService: CacheService,
    ) {
        super()
    }

    protected override async process(query: IndexSearchQuery): Promise<IndexSearchData> {
        const {
            request: {
                query: keywordRaw,
                size = 10,
                type,
            },
            locale,
        } = query.params

        const keyword = keywordRaw.trim()
        if (!keyword) {
            return {
                items: [],
            }
        }

        const mapped = INDEX_MAP[type]
        const esQuery: estypes.QueryDslQueryContainer = {
            bool: {
                must: [
                    {
                        term: {
                            locale: locale ?? Locale.En,
                        },
                    },
                ],
                should: [
                    {
                        multi_match: {
                            query: keyword,
                            type: "bool_prefix",
                            fields: [
                                "title^4",
                                "title._2gram^3",
                                "title._3gram^2",
                            ],
                        },
                    },
                    {
                        match: {
                            title: {
                                query: keyword,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                            },
                        },
                    },
                    {
                        match: {
                            description: {
                                query: keyword,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                            },
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        }

        const response = await this.elasticsearch.client.search({
            index: mapped.index,
            size,
            query: esQuery,
            highlight: {
                fields: {
                    title: {
                    },
                    description: {
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

        const items = await Promise.all(response.hits.hits.map(async (hit) => {
            const source = hit._source as IndexSearchHitSource | undefined
            const id = source?.id ?? hit._id ?? ""
            const parentRef = await this.cacheService.get({
                key: CacheKey.ParentIndex,
                args: [
                    mapped.entityName,
                    id,
                ],
            })
            const row: IndexSearchItem = {
                id,
                displayId: source?.displayId ?? "",
                title: source?.title ?? "",
                texts: [
                    ...(hit.highlight?.title ?? []),
                    ...(hit.highlight?.description ?? []),
                ].filter(Boolean) as Array<string>,
                parentPath: this.toParentPath(parentRef),
            }
            if (!row.texts.length) {
                row.texts = [row.title].filter(Boolean)
            }
            return row
        }))

        return {
            items,
        }
    }

    private toParentPath(
        parentRef: ParentIndexCacheResult | undefined,
    ): IndexSearchParentPath | undefined {
        if (!parentRef) {
            return undefined
        }
        return {
            courseDisplayId: "course" in parentRef ? parentRef.course.displayId : undefined,
            moduleDisplayId: "module" in parentRef ? parentRef.module.displayId : undefined,
            contentDisplayId: "content" in parentRef ? parentRef.content.displayId : undefined,
            challengeDisplayId: "challenge" in parentRef ? parentRef.challenge.displayId : undefined,
        }
    }
}
