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
    MilestoneTaskProgressRequest,
    MilestoneTaskProgressResponse,
    MilestoneTaskProgressResponseData,
} from "./graphql-types"
import {
    MilestoneTaskProgressService,
} from "./milestone-task-progress.service"

@Resolver()
export class MilestoneTaskProgressResolver {
    constructor(
        private readonly service: MilestoneTaskProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone task progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ task thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MilestoneTaskProgressResponse,
        {
            name: "milestoneTaskProgress",
            description: "Returns cached milestone task completion progress for the current user's enrollment.",
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
            request: MilestoneTaskProgressRequest,
    ): Promise<MilestoneTaskProgressResponseData> {
        return this.service.execute({
            request,
            user,
        })
    }
}
