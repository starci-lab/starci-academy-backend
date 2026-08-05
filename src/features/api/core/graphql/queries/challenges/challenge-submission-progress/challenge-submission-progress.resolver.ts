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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengeSubmissionProgressRequest,
} from "./graphql-types/request"
import {
    ChallengeSubmissionProgressResponse,
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types/response"
import {
    ChallengeSubmissionProgressService,
} from "./challenge-submission-progress.service"

@Resolver()
/**
 * GraphQL entry point for `challengeSubmissionProgress`: forwards to the
 * CQRS query bus via {@link ChallengeSubmissionProgressService}.
 */
export class ChallengeSubmissionProgressResolver {
    constructor(
        private readonly service: ChallengeSubmissionProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submission progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ bài tập thành công", // vn-ok: vi-locale string emitted to clients
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
