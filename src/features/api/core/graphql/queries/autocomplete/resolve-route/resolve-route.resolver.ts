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
    EntityManager,
} from "typeorm"
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
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    CodingProblemEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    buildEntityRoute,
    fromGlobalId,
} from "@modules/routing"
import {
    ResolveRouteData,
    ResolveRouteRequest,
    ResolveRouteResponse,
} from "./graphql-types"

/**
 * Relay-style route index ("index server"): one door that turns an opaque entity
 * global id into its canonical, locale-agnostic route. Reuses the same
 * parent-index cache + path builder as global search, so any link in the app
 * (feed tokens, deep-links) resolves consistently. The client just prepends the
 * locale and pushes the returned path.
 */
@Resolver()
export class ResolveRouteResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Route resolved successfully",
        [Locale.Vi]: "Phân giải đường dẫn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ResolveRouteResponse,
        {
            name: "resolveRoute",
            description: "Resolve an opaque entity global id into its canonical route path.",
        },
    )
    async execute(
        @Args("request")
            request: ResolveRouteRequest,
    ): Promise<ResolveRouteData> {
        // decode the opaque token → { entityName, id }; bail to null on garbage
        const decoded = fromGlobalId(request.globalId)
        if (!decoded) {
            return {
                path: null,
            }
        }
        const {
            entityName,
            id,
        } = decoded

        // user has no parent-index entry → route straight to the public profile
        if (entityName === UserEntity.name) {
            return {
                path: `/users/${id}`,
            }
        }

        // coding problems are slug-routed and not in the parent index → look up slug
        if (entityName === CodingProblemEntity.name) {
            const problem = await this.entityManager.findOne(
                CodingProblemEntity,
                {
                    where: {
                        id,
                    },
                    select: {
                        id: true,
                        slug: true,
                    },
                },
            )
            return {
                path: problem ? `/practice/${problem.slug}` : null,
            }
        }

        // course/module/content/challenge/milestone(Task)/flashcardDeck → parent-index
        const parentRef = await this.cacheService.get({
            key: CacheKey.ParentIndex,
            args: [
                entityName,
                id,
            ],
        })
        return {
            path: buildEntityRoute({
                entityName,
                id,
                parentRef,
            }),
        }
    }
}
