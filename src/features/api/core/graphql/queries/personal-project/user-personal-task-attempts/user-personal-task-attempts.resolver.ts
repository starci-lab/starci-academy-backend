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
    UserPersonalTaskAttemptsRequest,
    UserPersonalTaskAttemptsResponse,
    UserPersonalTaskAttemptsResponseData,
} from "./graphql-types"
import {
    UserPersonalTaskAttemptsService,
} from "./user-personal-task-attempts.service"

@Resolver()
export class UserPersonalTaskAttemptsResolver {
    constructor(
        private readonly service: UserPersonalTaskAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Personal task attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách lần thử thành công",
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
