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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CodingProgressService,
} from "@modules/bussiness/coding/coding-progress.service"
import {
    MyCodingProgressResponse,
    type MyCodingProgressResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Returns the authenticated user's coding-practice status (solved/attempted/
 * revealed ids + total points) from the Redis-cached progress -- decoupled from
 * the shared `codingProblems` catalog (served from Elasticsearch).
 */
export class MyCodingProgressResolver {
    constructor(
        private readonly codingProgressService: CodingProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCodingProgressResponse,
        {
            name: "myCodingProgress",
            description: "The user's coding status: solved/attempted/revealed ids + total points.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyCodingProgressResponseData> {
        // cached per-user progress (computed on miss, invalidated on submit)
        return this.codingProgressService.getProgress({
            userId: user.id,
        })
    }
}
