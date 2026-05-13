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
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UserCvSubmissionAttemptsHistoryService,
} from "./user-cv-submission-attempts-history.service"
import {
    CvReviewHistoryResponse,
    CvReviewHistoryResponseData,
} from "./graphql-types"

@Resolver()
export class UserCvSubmissionAttemptsHistoryResolver {
    constructor(
        private readonly userCvSubmissionAttemptsHistoryService: UserCvSubmissionAttemptsHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV review history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử review CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CvReviewHistoryResponse,
        {
            name: "cvReviewHistory",
            description: "Returns review history versions for the current user's CV submission attempts.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CvReviewHistoryResponseData> {
        return this.userCvSubmissionAttemptsHistoryService.execute(
            {
                request: {
                },
                locale,
                user,
            },
        )
    }
}
