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
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
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
    MyInProgressChallengeItemData,
    MyInProgressChallengesResponse,
} from "./graphql-types"

/** Max enrollments scanned for in-progress challenges (bounds the payload). */
const DASHBOARD_LIMIT = 30

@Resolver()
/**
 * Rail query: challenges the viewer has started but not yet passed. Reuses the
 * cached ChallengeProgressService (the started-but-not-passed status logic already
 * lives there) instead of a hand-rolled GROUP BY / HAVING query, then fetches the
 * titles for the in-progress ids.
 */
export class MyInProgressChallengesResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeProgressService: ChallengeProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress challenges fetched successfully",
        [Locale.Vi]: "Lấy danh sách challenge đang làm thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInProgressChallengesResponse,
        {
            name: "myInProgressChallenges",
            description: "Challenges the viewer has started but not yet passed (rail list).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyInProgressChallengeItemData>> {
        // the viewer's enrollments scope which courses' challenges to check
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                take: DASHBOARD_LIMIT,
            },
        )

        // per-enrollment progress from the cached service
        const progresses = await Promise.all(
            enrollments.map((enrollment) => this.challengeProgressService.getProgress({
                courseId: enrollment.courseId,
                enrollmentId: enrollment.id,
            })),
        )
        // started-but-not-passed = InProgress or Failed status across all courses
        const inProgressChallengeIds = progresses.flatMap((progress) => progress.completionTasks
            .filter((task) => task.status === ChallengeProgressStatus.InProgress
                || task.status === ChallengeProgressStatus.Failed)
            .map((task) => task.id))

        // skip the title query entirely when nothing is in progress
        const challenges = inProgressChallengeIds.length > 0
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

        // map each to a clickable token
        return challenges.map((challenge) => ({
            globalId: toGlobalId(ChallengeEntity.name,
                challenge.id),
            label: challenge.title,
        }))
    }
}
