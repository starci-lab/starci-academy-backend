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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ContentsRequest,
    ContentsResponse,
    ContentsResponseData,
} from "./graphql-types"
import {
    ContentsService,
} from "./contents.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"

@Resolver()
/**
 * GraphQL surface for `contents` — module-scoped paginated list; enroll guard
 * intentionally omitted so logged-in users can trial-browse truncated premiums.
 */
export class ContentsResolver {
    constructor(
        private readonly contentsService: ContentsService,
    ) {}

    /**
     * Lists contents for a module with page-based pagination.
     * Enroll guard removed — logged-in users may browse the content list for trial reading.
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
