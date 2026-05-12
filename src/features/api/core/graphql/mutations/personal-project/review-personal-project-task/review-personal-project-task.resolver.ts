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
    ReviewPersonalProjectTaskRequest,
    ReviewPersonalProjectTaskResponse,
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types"
import {
    ReviewPersonalProjectTaskService,
} from "./review-personal-project-task.service"

@Resolver()
export class ReviewPersonalProjectTaskResolver {
    constructor(
        private readonly service: ReviewPersonalProjectTaskService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Task review queued successfully",
        [Locale.Vi]: "Đã gửi yêu cầu chấm task thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviewPersonalProjectTaskResponse,
        {
            name: "reviewPersonalProjectTask",
            description: "Submit a single milestone task for AI review against its pass criteria.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project task review request.",
            },
        )
            request: ReviewPersonalProjectTaskRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ReviewPersonalProjectTaskResponseData> {
        return this.service.execute({
            request,
            user,
            locale,
        })
    }
}
