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
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    TaskRequest,
    TaskResponse,
} from "./graphql-types"
import {
    TaskService,
} from "./task.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    GraphQLCacheInterceptor,
    GraphQLCacheResponse,
} from "@modules/cache"
import {
    CacheKey,
} from "@modules/cache"

@Resolver(() => MilestoneTaskEntity)
/**
 * Authenticated `task` query for the milestone-task detail page. Requires
 * enrolment (`GraphQLMustEnrolledGuard`) and is cached by task id so
 * repeat opens of the same task skip the S3 round-trip.
 */
export class TaskResolver {
    constructor(
        private readonly taskService: TaskService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Task fetched successfully",
        [Locale.Vi]: "Lấy task thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @GraphQLCacheResponse({
        key: CacheKey.MilestoneTask,
        argsExtractor: (request) => [request.id],
    })
    @UseInterceptors(
        GraphQLTransformInterceptor,
        GraphQLCacheInterceptor,
    )
    @Query(
        () => TaskResponse,
        {
            name: "task",
            description: "Returns a single milestone task by id (with nested criteria).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Task lookup: provide id.",
            },
        )
            request: TaskRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MilestoneTaskEntity> {
        return this.taskService.execute(
            {
                request,
                locale,
            },
        )
    }
}
