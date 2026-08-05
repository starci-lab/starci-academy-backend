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
    CourseEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    MilestoneTaskAttemptsCmsService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    clampPagination,
} from "@modules/common"
import {
    MyMilestoneTaskAttemptsData,
    MyMilestoneTaskAttemptsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Learner-CMS query: the authenticated user's milestone-task review attempts
 * (newest first), paginated with `{ items, total }`. A plain list read keyed by
 * the viewer (the LIST exception — no CQRS projection); the service reads the
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
