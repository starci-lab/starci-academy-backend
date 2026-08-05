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
    ContentsRequest,
} from "./graphql-types/request"
import {
    ContentsResponse,
    ContentsResponseData,
} from "./graphql-types/response"
import {
    ContentsService,
} from "./contents.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"

@Resolver()
/**
 * GraphQL surface for `contents` -- module-scoped paginated list; enroll guard
 * intentionally omitted so logged-in users can trial-browse truncated premiums.
 */
export class ContentsResolver {
    constructor(
        private readonly contentsService: ContentsService,
    ) {}

    /**
     * Lists contents for a module with page-based pagination.
     * Enroll guard removed -- logged-in users may browse the content list for trial reading.
     * Premium content bodies are truncated server-side; the FE shows a paywall overlay.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contents fetched successfully",
        [Locale.Vi]: "Lấy danh sách nội dung thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentsResponse,
        {
            name: "contents",
            description: "Lists contents for a module with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Module id, pagination, and sort request.",
            },
        )
            request: ContentsRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ContentsResponseData> {
        return this.contentsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
