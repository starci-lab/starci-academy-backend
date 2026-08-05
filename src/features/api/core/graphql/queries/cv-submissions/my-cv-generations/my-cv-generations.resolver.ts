import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    MyCvGenerationsRequest,
} from "./graphql-types/request"
import {
    CvGenerationListItem,
    MyCvGenerationsResponse,
} from "./graphql-types/response"
import {
    MyCvGenerationsService,
} from "./my-cv-generations.service"

@Resolver()
/**
 * GraphQL entry for `myCvGenerations`: paginated lightweight history of the
 * caller's CV runs. Detail fields are fetched separately via `cvGeneration`.
 */
export class MyCvGenerationsResolver {
    constructor(
        private readonly myCvGenerationsService: MyCvGenerationsService,
    ) { }

    /**
     * Paginated list of the current user's CV generation runs (newest first).
     * Each row exposes id / mode / status / createdAt / processedAt; requires
     * authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV generations fetched successfully",
        [Locale.Vi]: "Lấy danh sách CV đã tạo thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCvGenerationsResponse,
        {
            name: "myCvGenerations",
            description: "Paginated list of the current user's CV generation runs.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args(
            "request",
            {
                type: () => MyCvGenerationsRequest,
                nullable: true,
            },
        )
            request?: MyCvGenerationsRequest,
    ): Promise<Array<CvGenerationListItem>> {
        return this.myCvGenerationsService.execute(
            {
                request: request ?? {
                },
                locale,
                user,
            },
        )
    }
}
