import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UserCvSubmissionAttemptsService,
} from "./user-cv-submission-attempts.service"
import {
    UserCvSubmissionAttemptsPayload,
    UserCvSubmissionAttemptsRequest,
    UserCvSubmissionAttemptsResponse,
} from "./graphql-types"

@Resolver()
export class UserCvSubmissionAttemptsResolver {
    constructor(
        private readonly userCvSubmissionAttemptsService: UserCvSubmissionAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV submission attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách phiên bản CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCvSubmissionAttemptsResponse,
        {
            name: "userCvSubmissionAttempts",
            description: "Returns paginated CV submission attempts for the current user.",
        },
    )
    async userCvSubmissionAttempts(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args(
            "request",
            {
                type: () => UserCvSubmissionAttemptsRequest,
                nullable: true,
            },
        )
            request?: UserCvSubmissionAttemptsRequest,
    ): Promise<UserCvSubmissionAttemptsPayload> {
        return this.userCvSubmissionAttemptsService.execute(
            {
                request: request ?? {},
                locale,
                user,
            },
        )
    }
}
