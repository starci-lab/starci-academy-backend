import {
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
    JobReadinessService,
} from "./job-readiness.service"
import {
    JobReadinessData,
    JobReadinessResponse,
} from "./graphql-types"

@Resolver()
/**
 * The VIEWER's own composite job-readiness — a portfolio of verified tracks
 * across every course they've paid into, plus the global CV + challenge
 * foundation. Global (not course-scoped): auth-only, no enrollment guard, since
 * it aggregates whatever courses the learner has.
 */
export class MyJobReadinessResolver {
    constructor(
        private readonly jobReadinessService: JobReadinessService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job readiness fetched successfully",
        [Locale.Vi]: "Lấy điểm sẵn sàng đi làm thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => JobReadinessResponse,
        {
            name: "myJobReadiness",
            description: "The viewer's composite job-readiness portfolio across all their courses.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<JobReadinessData> {
        return this.jobReadinessService.compute({
            userId: user.id,
        })
    }
}
