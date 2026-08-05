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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    TaskRequest,
} from "./graphql-types/request"
import {
    TaskResponse,
} from "./graphql-types/response"
import {
    TaskService,
} from "./task.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    GraphQLCacheInterceptor,
    GraphQLCacheResponse,
} from "@modules/integrations/cache/interceptors/graphql-cache.interceptor"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"

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
        [Locale.Vi]: "Lấy task thành công", // vn-ok: vi-locale string emitted to clients
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
