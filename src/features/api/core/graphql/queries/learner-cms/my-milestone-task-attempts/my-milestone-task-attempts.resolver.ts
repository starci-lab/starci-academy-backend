import {
    Args,
    Int,
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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MilestoneTaskAttemptsCmsService,
} from "@modules/bussiness/learner-cms/milestone-task-attempts-cms.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    clampPagination,
} from "@modules/lib/common/utils/pagination"
import {
    MyMilestoneTaskAttemptsData,
    MyMilestoneTaskAttemptsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Learner-CMS query: the authenticated user's milestone-task review attempts
 * (newest first), paginated with `{ items, total }`. A plain list read keyed by
 * the viewer (the LIST exception -- no CQRS projection); the service reads the
 * live tables and the resolver wraps the course UUID into the opaque global id.
 */
export class MyMilestoneTaskAttemptsResolver {
    constructor(
        private readonly milestoneTaskAttemptsCmsService: MilestoneTaskAttemptsCmsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone task attempts fetched successfully",
        [Locale.Vi]: "Lấy lịch sử làm nhiệm vụ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyMilestoneTaskAttemptsResponse,
        {
            name: "myMilestoneTaskAttempts",
            description: "The authenticated user's milestone-task review attempts (newest first), paginated.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 20,
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
            })
            offset: number,
    ): Promise<MyMilestoneTaskAttemptsData> {
        // read one page of the viewer's attempts; clamp the window so a hostile
        // client can't request an unbounded scan
        const page = await this.milestoneTaskAttemptsCmsService.list({
            userId: user.id,
            ...clampPagination(limit,
                offset),
        })
        return {
            // map each attempt to its GraphQL shape; the course UUID becomes an
            // opaque global id and the Date becomes an ISO string
            items: page.items.map((item) => ({
                id: item.id,
                taskTitle: item.taskTitle,
                milestoneTitle: item.milestoneTitle,
                courseTitle: item.courseTitle,
                courseGlobalId: toGlobalId(CourseEntity.name,
                    item.courseId),
                passed: item.passed,
                score: item.score,
                attemptedAt: item.attemptedAt.toISOString(),
            })),
            total: page.total,
        }
    }
}
