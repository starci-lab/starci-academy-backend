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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    ReviewPersonalProjectForTaskRequest,
    ReviewPersonalProjectForTaskResponse,
    ReviewPersonalProjectForTaskResponseData,
} from "./graphql-types"
import {
    ReviewPersonalProjectForTaskService,
} from "./review-personal-project-for-task.service"

@Resolver()
export class ReviewPersonalProjectForTaskResolver {
    constructor(
        private readonly service: ReviewPersonalProjectForTaskService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Review queued successfully",
        [Locale.Vi]: "Đã gửi yêu cầu chấm bài thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviewPersonalProjectForTaskResponse,
        {
            name: "reviewPersonalProjectForTask",
            description: "Submit a GitHub URL for AI review of a personal project milestone.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project review request.",
            },
        )
            request: ReviewPersonalProjectForTaskRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ReviewPersonalProjectForTaskResponseData> {
        return this.service.execute({
            request,
            user,
            locale,
        })
    }
}
