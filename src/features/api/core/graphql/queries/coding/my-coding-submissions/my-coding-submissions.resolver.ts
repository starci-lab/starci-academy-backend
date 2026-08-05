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
    CodingSubmissionService,
} from "@modules/bussiness/coding/coding-submission.service"
import {
    MyCodingSubmissionsRequest,
} from "./graphql-types/request"
import {
    MyCodingSubmissionsResponse,
    type MyCodingSubmissionsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Returns the authenticated user's submission history for one problem
 * (newest first) -- used by the editor's "Submissions" tab.
 */
export class MyCodingSubmissionsResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submissions fetched successfully",
        [Locale.Vi]: "Lấy lịch sử nộp bài thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCodingSubmissionsResponse,
        {
            name: "myCodingSubmissions",
            description: "Returns the authenticated user's submissions for a problem (newest first).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Problem slug + pagination.",
            },
        )
            request: MyCodingSubmissionsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyCodingSubmissionsResponseData> {
        // scope the history to the authenticated user + requested problem
        return this.codingSubmissionService.listMine({
            userId: user.id,
            slug: request.slug,
            page: request.page,
            limit: request.limit,
        })
    }
}
