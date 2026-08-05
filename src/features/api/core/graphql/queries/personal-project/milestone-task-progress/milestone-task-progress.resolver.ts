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
    MilestoneTaskProgressRequest,
} from "./graphql-types/request"
import {
    MilestoneTaskProgressResponse,
    MilestoneTaskProgressResponseData,
} from "./graphql-types/response"
import {
    MilestoneTaskProgressService,
} from "./milestone-task-progress.service"

@Resolver()
/**
 * GraphQL entry point for `milestoneTaskProgress`: forwards to the CQRS
 * query bus via {@link MilestoneTaskProgressService}.
 */
export class MilestoneTaskProgressResolver {
    constructor(
        private readonly service: MilestoneTaskProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone task progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ task thành công", // vn-ok: vi-locale string emitted to clients
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
