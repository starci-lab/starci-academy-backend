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
    JobReadinessService,
} from "./job-readiness.service"
import {
    JobReadinessData,
    JobReadinessResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * PUBLIC job-readiness for a given user id -- the recruiter-facing view on a
 * public profile / the talent marketplace. Same portfolio the owner sees, but
 * addressable by user id. Optional auth; a locked profile is withheld by
 * {@link GraphQLProfileVisibilityGuard} (mirrors `userChallengeStrength`).
 */
export class UserJobReadinessResolver {
    constructor(
        private readonly jobReadinessService: JobReadinessService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job readiness fetched successfully",
        [Locale.Vi]: "Lấy điểm sẵn sàng đi làm thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => JobReadinessResponse,
        {
            name: "userJobReadiness",
            description: "A user's public composite job-readiness portfolio, by user id (for recruiters).",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose job-readiness portfolio to fetch.",
            },
        )
            userId: string,
    ): Promise<JobReadinessData> {
        return this.jobReadinessService.compute({
            userId,
        })
    }
}
