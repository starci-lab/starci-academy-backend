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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    LivestreamSessionsRequest,
} from "./graphql-types/request"
import {
    LivestreamSessionsResponse,
    LivestreamSessionsResponseData,
} from "./graphql-types/response"
import {
    LivestreamSessionsService,
} from "./livestream-sessions.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"

@Resolver()
/**
 * Auth + enrollment-gated GraphQL entry for `livestreamSessions` -- recurring
 * schedule rows for one course, page-based.
 */
export class LivestreamSessionsResolver {
    constructor(
        private readonly livestreamSessionsService: LivestreamSessionsService,
    ) {}

    /**
     * Lists recurring livestream sessions for a course (paginated).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Livestream sessions fetched successfully",
        [Locale.Vi]: "Lấy lịch livestream thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => LivestreamSessionsResponse,
        {
            name: "livestreamSessions",
            description:
                "Lists recurring livestream sessions for a course with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Course id, pagination, and sort request.",
            },
        )
            request: LivestreamSessionsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<LivestreamSessionsResponseData> {
        return this.livestreamSessionsService.execute(
            {
                request,
                locale,
            },
        )
    }
}
