import {
    Args,
    ID,
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
    UserCodingProjectionService,
} from "@modules/bussiness"
import {
    UserCodingSkillsData,
    UserCodingSkillsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: a user's solved-coding breakdown by language + difficulty.
 * Thin read of the CQRS coding projection (the GROUP BYs run in the projection's
 * recompute, kept fresh by CDC + TTL lazy-refresh -- never inline here). Optional
 * auth; a locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserCodingSkillsResolver {
    constructor(
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding skills fetched successfully",
        [Locale.Vi]: "Lấy kỹ năng lập trình thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCodingSkillsResponse,
        {
            name: "userCodingSkills",
            description: "A user's solved-coding breakdown by language + difficulty, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose coding skills to fetch.",
            },
        )
            userId: string,
    ): Promise<UserCodingSkillsData> {
        // thin projection read (recompute/refresh happens inside the projection)
        const skills = await this.userCodingProjectionService.getSkills(userId)
        return {
            byLanguage: skills.byLanguage,
            byDifficulty: skills.byDifficulty,
            byDomain: skills.byDomain,
        }
    }
}
