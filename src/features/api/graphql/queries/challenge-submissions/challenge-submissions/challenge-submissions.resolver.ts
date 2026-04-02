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
    ChallengeSubmissionsRequest,
    ChallengeSubmissionsResponse,
    ChallengeSubmissionsResponseData,
} from "./graphql-types"
import {
    ChallengeSubmissionsService,
} from "./challenge-submissions.service"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class ChallengeSubmissionsResolver {
    constructor(
        private readonly challengeSubmissionsService: ChallengeSubmissionsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submissions fetched successfully",
        [Locale.Vi]: "Lấy danh sách challenge submission thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengeSubmissionsResponse,
        {
            name: "challengeSubmissions",
            description: "Returns all challenge submissions for a challenge; each item includes userSubmission for the current user (no userSubmissions list).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Challenge id and optional sort.",
            },
        )
            request: ChallengeSubmissionsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ChallengeSubmissionsResponseData> {
        return this.challengeSubmissionsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
