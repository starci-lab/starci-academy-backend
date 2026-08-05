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
    UserPersonalTaskAttemptsRequest,
} from "./graphql-types/request"
import {
    UserPersonalTaskAttemptsResponse,
    UserPersonalTaskAttemptsResponseData,
} from "./graphql-types/response"
import {
    UserPersonalTaskAttemptsService,
} from "./user-personal-task-attempts.service"

@Resolver()
/**
 * GraphQL surface for `userPersonalTaskAttempts` -- authenticated attempt history
 * for the caller's enrollment on a milestone task.
 */
export class UserPersonalTaskAttemptsResolver {
    constructor(
        private readonly service: UserPersonalTaskAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Personal task attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách lần thử thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserPersonalTaskAttemptsResponse,
        {
            name: "userPersonalTaskAttempts",
            description: "Returns a paginated list of review attempts for a personal project task.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: UserPersonalTaskAttemptsRequest,
    ): Promise<UserPersonalTaskAttemptsResponseData> {
        return this.service.execute({
            request,
            user,
        })
    }
}
