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
    ChallengeSubmissionProgressRequest,
    ChallengeSubmissionProgressResponse,
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types"
import {
    ChallengeSubmissionProgressService,
} from "./challenge-submission-progress.service"

@Resolver()
export class ChallengeSubmissionProgressResolver {
    constructor(
        private readonly service: ChallengeSubmissionProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submission progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ bài tập thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengeSubmissionProgressResponse,
        {
            name: "challengeSubmissionProgress",
            description: "Returns cached challenge submission progress for the current user's enrollment.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course ID to fetch progress for.",
            },
        )
            request: ChallengeSubmissionProgressRequest,
    ): Promise<ChallengeSubmissionProgressResponseData> {
        return this.service.execute({
            request,
            user,
        })
    }
}
