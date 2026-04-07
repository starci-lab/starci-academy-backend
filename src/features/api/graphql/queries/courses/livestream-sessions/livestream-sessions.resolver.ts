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
} from "@modules/databases"
import {
    LivestreamSessionsRequest,
    LivestreamSessionsResponse,
    LivestreamSessionsResponseData,
} from "./graphql-types"
import {
    LivestreamSessionsService,
} from "./livestream-sessions.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
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
        [Locale.Vi]: "Lấy lịch livestream thành công",
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
