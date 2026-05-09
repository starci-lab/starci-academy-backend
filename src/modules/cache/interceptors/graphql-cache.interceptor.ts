import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    SetMetadata,
} from "@nestjs/common"
import {
    Reflector,
} from "@nestjs/core"
import {
    Observable,
    of,
} from "rxjs"
import {
    tap,
} from "rxjs/operators"
import {
    CacheService,
} from "../cache.service"
import {
    CacheKey,
} from "../enums"

/**
 * Metadata key for cached GraphQL response config.
 */
const GRAPHQL_CACHE_METADATA = "graphqlCacheMetadata"

/**
 * Configuration for the GraphQL cache interceptor.
 */
export interface GraphQLCacheConfig {
    /** Cache key enum to use. */
    key: CacheKey
    /**
     * Extracts the cache arguments from the GraphQL resolver arguments.
     * Receives the `request` arg object and the authenticated `user` object.
     * Must return a stable array of primitives used to build the composite cache key.
     *
     * @example
     * argsExtractor: (request, user) => [request.courseId, user?.id]
     */
    argsExtractor: (request: any, user: any) => Array<any>
}

/**
 * Decorator: marks a GraphQL resolver for automatic Redis caching.
 *
 * @example
 * ```ts
 * @GraphQLCacheResponse({
 *     key: CacheKey.EnrollmentMilestones,
 *     argsExtractor: (request, user) => [request.courseId, user?.id],
 * })
 * ```
 */
export const GraphQLCacheResponse = (config: GraphQLCacheConfig) =>
    SetMetadata(GRAPHQL_CACHE_METADATA,
        config)

/**
 * NestJS interceptor that caches GraphQL resolver responses in Redis.
 *
 * Usage:
 * 1. Add `@GraphQLCacheResponse({ key, argsExtractor })` on the resolver method.
 * 2. Add `@UseInterceptors(GraphQLCacheInterceptor)` on the resolver method.
 *
 * On cache hit, the handler is skipped entirely and the cached value is returned.
 * On cache miss, the handler runs and the result is stored in Redis.
 */
@Injectable()
export class GraphQLCacheInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly cacheService: CacheService,
    ) { }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const config = this.reflector.get<GraphQLCacheConfig>(
            GRAPHQL_CACHE_METADATA,
            context.getHandler(),
        )

        /** If no cache config is set, skip caching entirely. */
        if (!config) {
            return next.handle()
        }

        /** Extract resolver arguments from the GQL context. */
        const gqlArgs = context.getArgs()
        /**
         * Convention: in NestJS GraphQL resolvers, args are ordered:
         * [root, args, context, info]
         * The `request` is typically the first named arg (index 1),
         * and the `user` is injected via @KeycloakGraphQLUser (also index 1+).
         *
         * We extract all non-undefined positional args after root for the extractor.
         */
        const request = gqlArgs[1]
        const user = gqlArgs[2]

        const cacheArgs = config.argsExtractor(request,
            user)

        /** Try cache first. */
        const cached = await this.cacheService.get({
            key: config.key,
            args: cacheArgs,
        })

        if (cached !== undefined) {
            if (this.isSuccessfulResult(cached)) {
                return of(cached)
            }
            // Cached value is a failed payload -> evict and recompute.
            await this.cacheService.del({
                key: config.key,
                args: cacheArgs,
            })
        }

        /** Cache miss — run handler, then store result. */
        return next.handle().pipe(
            tap(async (result) => {
                if (this.isSuccessfulResult(result)) {
                    await this.cacheService.set({
                        key: config.key,
                        args: cacheArgs,
                        cacheResult: result,
                    })
                }
            }),
        )
    }

    /**
     * Cache only successful resolver responses.
     * If response has `success` flag, it must be `true`.
     */
    private isSuccessfulResult(result: unknown): boolean {
        if (result === undefined || result === null) {
            return false
        }
        if (typeof result === "object" && result !== null && "success" in result) {
            return (result as { success?: unknown }).success === true
        }
        return true
    }
}
