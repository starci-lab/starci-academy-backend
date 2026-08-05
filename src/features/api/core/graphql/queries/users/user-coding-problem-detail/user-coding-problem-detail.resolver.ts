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
    UserCodingProblemDetailData,
    UserCodingProblemDetailRequest,
    UserCodingProblemDetailResponse,
} from "./graphql-types"
import {
    UserCodingProblemDetailService,
} from "./user-coding-problem-detail.service"

@Resolver()
/**
 * Public profile query: the detail of ONE coding problem, backing
 * `/profile/<username>/skills/<slug>` -- the problem itself (statement, tags,
 * sample testcases, starter codes; no ownership check) plus the TARGET user's
 * accepted-submission summary (languages/verdict/passedCount/totalCount/
 * firstSolvedAt), or null when unsolved. Same guard stack as
 * `userCodingHistory` (optional auth + {@link GraphQLProfileVisibilityGuard})
 * so a locked profile withholds this the same way it withholds the list.
 */
export class UserCodingProblemDetailResolver {
    constructor(
        private readonly userCodingProblemDetailService: UserCodingProblemDetailService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding problem detail fetched successfully",
        [Locale.Vi]: "Lấy chi tiết bài tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCodingProblemDetailResponse,
        {
            name: "userCodingProblemDetail",
            description: "Detail of one coding problem plus a target user's accepted-submission summary (public profile).",
        },
    )
    async execute(
        @Args("request")
            request: UserCodingProblemDetailRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<UserCodingProblemDetailData> {
        return this.userCodingProblemDetailService.execute(request,
            locale)
    }
}
