import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MyPinnableCapstoneItemData,
} from "./graphql-types/item"
import {
    MyPinnableCapstonesResponse,
} from "./graphql-types/response"
import type {
    PinnableCapstoneRow,
} from "./types/capstone"

@Resolver()
/**
 * Owner-scoped query feeding the "pin a course project" picker: the current
 * user's enrollments that already have a capstone repo -- either a submitted
 * personal-project GitHub URL or a completed task plan.
 *
 * This is a small owner-only list, so it reads the join directly via the
 * EntityManager (the documented "list" exception to the CQRS-projection rule)
 * rather than maintaining a projection. `isVerified` is `tasks_completed_at IS
 * NOT NULL`; `githubUrl` is the enrollment's submitted project URL.
 */
export class MyPinnableCapstonesResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Pinnable capstones fetched successfully",
        [Locale.Vi]: "Lấy danh sách dự án có thể ghim thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyPinnableCapstonesResponse,
        {
            name: "myPinnableCapstones",
            description: "The current user's enrollments that have a capstone repo (pin picker).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyPinnableCapstoneItemData>> {
        // direct owner-scoped join: every enrollment of this user that already
        // has something to pin -- a submitted project repo OR a completed plan.
        // LEFT JOIN courses so a missing course row still yields the enrollment.
        const rows = await this.entityManager
            .createQueryBuilder(EnrollmentEntity,
                "enrollment")
            .leftJoin("courses",
                "course",
                "course.id = enrollment.course_id")
            .select("enrollment.id",
                "enrollment_id")
            .addSelect("course.title",
                "course_title")
            .addSelect("enrollment.personal_project_github_url",
                "github_url")
            // verified === the task plan has a completion timestamp
            .addSelect("enrollment.tasks_completed_at IS NOT NULL",
                "is_verified")
            .where("enrollment.user_id = :userId",
                {
                    userId: user.id,
                })
            // only enrollments with something pinnable: a repo or a finished plan
            .andWhere(
                "(enrollment.personal_project_github_url IS NOT NULL OR enrollment.tasks_completed_at IS NOT NULL)",
            )
            // verified capstones first, then by course title for a stable picker
            .orderBy("is_verified",
                "DESC")
            .addOrderBy("course.title",
                "ASC")
            .getRawMany<PinnableCapstoneRow>()

        // map the raw rows onto the API item, defaulting an absent title to ""
        return rows.map((row) => ({
            enrollmentId: row.enrollment_id,
            courseTitle: row.course_title ?? "",
            githubUrl: row.github_url ?? null,
            isVerified: Boolean(row.is_verified),
        }))
    }
}
