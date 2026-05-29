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
    CodingSubmissionService,
} from "@modules/bussiness"
import {
    MyCodingSubmissionsRequest,
    MyCodingSubmissionsResponse,
    type MyCodingSubmissionsResponseData,
} from "./graphql-types"

/**
 * Returns the authenticated user's submission history for one problem
 * (newest first) — used by the editor's "Submissions" tab.
 */
@Resolver()
export class MyCodingSubmissionsResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submissions fetched successfully",
        [Locale.Vi]: "Lấy lịch sử nộp bài thành công",
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
