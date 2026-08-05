import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
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
    UserEntity,
    Locale,
} from "@modules/databases"
import {
    StartTrialRequest,
    StartTrialResponse,
    StartTrialResponseData,
} from "./graphql-types"
import {
    StartTrialService,
} from "./start-trial.service"

@Resolver()
/**
 * GraphQL entry for starting a trial (preview) enrollment — the "Học thử" flow.
 */
export class StartTrialResolver {
    constructor(
        private readonly startTrialService: StartTrialService,
    ) {}

    /**
     * Creates a trial `enrollments` row (`is_enrolled = false`) for the user and
     * course. Idempotent: a no-op when any enrollment already exists.
     *
     * @param user - Authenticated user from Keycloak
     * @param request - Course to start a trial for
     * @returns The resulting enrollment flag
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Trial started successfully",
        [Locale.Vi]: "Bắt đầu học thử thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartTrialResponse,
        {
            name: "startTrial",
            description: "Create a trial (preview) enrollment for a course; idempotent; does not unlock paid-only surfaces.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id to start a trial for.",
            },
        )
            request: StartTrialRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<StartTrialResponseData> {
        return this.startTrialService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
