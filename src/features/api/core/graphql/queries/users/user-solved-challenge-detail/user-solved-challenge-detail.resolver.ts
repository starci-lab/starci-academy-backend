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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
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
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserSolvedChallengeDetailRequest,
} from "./graphql-types/request"
import {
    UserSolvedChallengeDetailData,
    UserSolvedChallengeDetailResponse,
} from "./graphql-types/response"
import {
    UserSolvedChallengeDetailService,
} from "./user-solved-challenge-detail.service"

@Resolver()
/**
 * Public profile query: the detail of ONE of a user's passed challenge
 * submissions -- title, link, language, score, course, and the AI feedback
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
        [Locale.Vi]: "Lấy chi tiết challenge đã giải thành công", // vn-ok: vi-locale string emitted to clients
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
