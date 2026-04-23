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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    SubmissionAttemptsService,
} from "./submission-attempts.service"
import {
    SubmissionAttemptsRequest,
    SubmissionAttemptsResponse,
    SubmissionAttemptsResponseData,
} from "./graphql-types"

@Resolver()
export class SubmissionAttemptsResolver {
    constructor(
        private readonly submissionAttemptsService: SubmissionAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách submission attempt thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SubmissionAttemptsResponse,
        {
            name: "submissionAttempts",
            description: "Returns a paginated list of submission attempts, optionally filtered by submission ID.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: SubmissionAttemptsRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SubmissionAttemptsResponseData> {
        return this.submissionAttemptsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
