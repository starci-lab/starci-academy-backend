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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    StartTrialRequest,
} from "./graphql-types/request"
import {
    StartTrialResponse,
    StartTrialResponseData,
} from "./graphql-types/response"
import {
    StartTrialService,
} from "./start-trial.service"

@Resolver()
/**
 * GraphQL entry for starting a trial (preview) enrollment.
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
        [Locale.Vi]: "Bắt đầu học thử thành công", // vn-ok: vi-locale string emitted to clients
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
