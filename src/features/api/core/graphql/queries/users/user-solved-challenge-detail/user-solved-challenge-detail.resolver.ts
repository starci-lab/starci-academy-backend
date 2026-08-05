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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    UserSolvedChallengeDetailData,
    UserSolvedChallengeDetailRequest,
    UserSolvedChallengeDetailResponse,
} from "./graphql-types"
import {
    UserSolvedChallengeDetailService,
} from "./user-solved-challenge-detail.service"

@Resolver()
/**
 * Public profile query: the detail of ONE of a user's passed challenge
 * submissions — title, link, language, score, course, and the AI feedback
 * list from the passing attempt. Same guard stack as `userSolvedChallenges`
 * (optional auth + {@link GraphQLProfileVisibilityGuard}) so a locked profile
 * withholds this the same way it withholds the list.
 */
export class UserSolvedChallengeDetailResolver {
    constructor(
        private readonly userSolvedChallengeDetailService: UserSolvedChallengeDetailService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solved challenge detail fetched successfully",
        [Locale.Vi]: "Lấy chi tiết challenge đã giải thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserSolvedChallengeDetailResponse,
        {
            name: "userSolvedChallengeDetail",
            description: "Detail of one of a target user's passed challenge submissions, including AI feedback from the passing attempt.",
        },
    )
    async execute(
        @Args("request")
            request: UserSolvedChallengeDetailRequest,
    ): Promise<UserSolvedChallengeDetailData> {
        return this.userSolvedChallengeDetailService.execute(request)
    }
}
