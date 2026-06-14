import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
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
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserContentEntity,
    UserEntity,
} from "@modules/databases"
import {
    ChallengeProgressService,
} from "@modules/bussiness"
import {
    ChallengeProgressStatus,
} from "@modules/cache"
import {
    toGlobalId,
} from "@modules/routing"
import {
    MyDashboardResponse,
    MyDashboardResponseData,
} from "./graphql-types"

/** Max rows pulled for each rail/feed (keeps the home payload bounded). */
const DASHBOARD_LIMIT = 30

/**
 * Aggregated dashboard query for the GitHub-style logged-in home.
 *
 * One round-trip returns the viewer's read-lesson history (left rail) and a feed
 * of activity from the users they follow (read/bookmark events). Both are read
 * with bounded raw SQL joining `user_contents` → content → module → course so
 * each item carries the parts needed to deep-link the lesson.
 */
@Resolver()
export class MyDashboardResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeProgressService: ChallengeProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Dashboard fetched successfully",
        [Locale.Vi]: "Lấy dữ liệu bảng điều khiển thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyDashboardResponse,
        {
            name: "myDashboard",
            description:
                "GitHub-style home for the authenticated user — read-lesson history "
                + "(left rail) plus a feed of followed users' read/bookmark activity.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyDashboardResponseData> {
        // left rail — built from the ORM + the cached progress service (no bespoke
        // aggregate SQL). Every item becomes a route-index token resolved on click.

        // viewer's enrollments drive both "joined courses" and "in progress"
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                relations: {
                    course: true,
                },
                order: {
                    createdAt: "DESC",
                },
                take: DASHBOARD_LIMIT,
            },
        )

        // (1) joined courses
        const enrolledCourses = enrollments
            .filter((enrollment) => Boolean(enrollment.course))
            .map((enrollment) => ({
                globalId: toGlobalId(CourseEntity.name,
                    enrollment.course.id),
                label: enrollment.course.title,
            }))

        // (2) recently-read lessons — plain ORM find, newest first
        const recentContents = await this.entityManager.find(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    isRead: true,
                },
                relations: {
                    content: true,
                },
                order: {
                    updatedAt: "DESC",
                },
                take: DASHBOARD_LIMIT,
            },
        )
        const learnedLessons = recentContents
            .filter((userContent) => Boolean(userContent.content))
            .map((userContent) => ({
                globalId: toGlobalId(ContentEntity.name,
                    userContent.content.id),
                label: userContent.content.title,
            }))

        // (3) challenges in progress — reuse the cached ChallengeProgressService
        // (the started-but-not-passed status logic already lives there) instead of
        // a hand-rolled GROUP BY / HAVING query
        const progresses = await Promise.all(
            enrollments.map((enrollment) => this.challengeProgressService.getProgress({
                courseId: enrollment.courseId,
                enrollmentId: enrollment.id,
            })),
        )
        const inProgressChallengeIds = progresses.flatMap((progress) => progress.completionTasks
            .filter((task) => task.status === ChallengeProgressStatus.InProgress
                || task.status === ChallengeProgressStatus.Failed)
            .map((task) => task.id))
        // fetch titles for the in-progress challenge ids (skip the query when none)
        const inProgressChallengeEntities = inProgressChallengeIds.length > 0
            ? await this.entityManager.find(
                ChallengeEntity,
                {
                    where: {
                        id: In(inProgressChallengeIds),
                    },
                    select: {
                        id: true,
                        title: true,
                    },
                },
            )
            : []
        const inProgressChallenges = inProgressChallengeEntities.map((challenge) => ({
            globalId: toGlobalId(ChallengeEntity.name,
                challenge.id),
            label: challenge.title,
        }))

        // rail-only: the feed (forYou/following) is now its own cursor-paginated
        // query (myFeed) — the dashboard no longer bundles it.
        return {
            enrolledCourses,
            learnedLessons,
            inProgressChallenges,
        }
    }
}
