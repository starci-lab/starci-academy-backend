import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
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
    UserFlashcardStatsProjectionService,
} from "@modules/bussiness"
import type {
    UserFlashcardStatsResult,
} from "@modules/bussiness"
import {
    MyFlashcardStatsResponse,
} from "./graphql-types"

@Resolver()
/**
 * The viewer's flashcard study stats — review streak, retention rate, and total
 * reviewed — derived from the `flashcard_review_events` log. Thin read off the
 * per-user CQRS projection (the history scan runs in recompute, not per request).
 */
export class MyFlashcardStatsResolver {
    constructor(
        private readonly userFlashcardStatsProjectionService: UserFlashcardStatsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê ôn tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardStatsResponse,
        {
            name: "myFlashcardStats",
            description: "The viewer's flashcard study stats (streak / retention / totals).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UserFlashcardStatsResult> {
        // thin projection read (streak / retention / totals, TTL lazy-refreshed)
        return this.userFlashcardStatsProjectionService.getStats({
            userId: user.id,
        })
    }
}
