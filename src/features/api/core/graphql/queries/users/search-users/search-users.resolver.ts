import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    estypes,
} from "@elastic/elasticsearch"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    toGlobalId,
} from "@modules/routing"
import {
    SearchUserData,
    SearchUsersRequest,
    SearchUsersResponse,
} from "./graphql-types"
import type {
    UserSearchHitSource,
} from "./types"

/** Default page size when the caller omits `limit`. */
const DEFAULT_LIMIT = 10
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 20

@Resolver()
/**
 * `searchUsers` query -- free-text search over the non-localized `users`
 * Elasticsearch index (kept in sync by `es-sync`). Matches the keyword against
 * the handle (prefix, for type-ahead), the display name and the bio (both fuzzy,
 * for typo tolerance), most-relevant first. Auth-only; returns the header fields
 * a result row / who-to-follow card needs.
 */
export class SearchUsersResolver {
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Users fetched successfully",
        [Locale.Vi]: "Tìm người dùng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SearchUsersResponse,
        {
            name: "searchUsers",
            description: "Free-text search over the Elasticsearch `users` index (handle / name / bio).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "User search request.",
            },
        )
            request: SearchUsersRequest,
    ): Promise<Array<SearchUserData>> {
        // normalize the keyword; an empty search has no meaningful results
        const keyword = request.query.trim()
        if (!keyword) {
            return []
        }
        // clamp the page size into [1, MAX_LIMIT] (caller default is DEFAULT_LIMIT)
        const size = Math.min(
            Math.max(request.limit ?? DEFAULT_LIMIT,
                1),
            MAX_LIMIT,
        )
        // resolve the concrete index name ("users" -- non-localized, no suffix)
        const index = this.elasticsearchService.indicateName({
            entity: UserEntity.name,
        })
        // relevance query: handle prefix (type-ahead) + fuzzy name/bio (typos).
        // username is weighted highest, then display name, then bio.
        const esQuery: estypes.QueryDslQueryContainer = {
            bool: {
                should: [
                    // exact-ish prefix on the handle -> fast type-ahead matches
                    {
                        match_phrase_prefix: {
                            username: {
                                query: keyword,
                                boost: 4,
                            },
                        },
                    },
                    // fuzzy handle match -> tolerate a typo in the @handle
                    {
                        match: {
                            username: {
                                query: keyword,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                                boost: 3,
                            },
                        },
                    },
                    // fuzzy display-name match
                    {
                        match: {
                            displayName: {
                                query: keyword,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                                boost: 2,
                            },
                        },
                    },
                    // fuzzy bio match -> lowest weight, broadens recall
                    {
                        match: {
                            bio: {
                                query: keyword,
                                fuzziness: "AUTO",
                            },
                        },
                    },
                ],
                // at least one clause must hit, else the doc is not a result
                minimum_should_match: 1,
            },
        }
        // run the search, pulling only the fields the card renders
        const response = await this.elasticsearchService.client.search({
            index,
            size,
            query: esQuery,
            _source: [
                "id",
                "username",
                "displayName",
                "avatar",
                "bio",
                "openToWork",
                "points",
            ],
        })
        // map each hit to the card shape; the doc id -> opaque global id for routing
        return response.hits.hits.map((hit) => {
            // the indexed `_source` (typed loosely -- fields may be partial)
            const source = hit._source as UserSearchHitSource | undefined
            // prefer the source id, fall back to the ES `_id`
            const id = source?.id ?? hit._id ?? ""
            return {
                globalId: toGlobalId(UserEntity.name,
                    id),
                username: source?.username ?? "",
                displayName: source?.displayName ?? null,
                avatar: source?.avatar ?? null,
                bio: source?.bio ?? null,
                openToWork: source?.openToWork ?? false,
                points: source?.points ?? 0,
            }
        })
    }
}
