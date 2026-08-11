import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserCourseProgressProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-course-progress-projection.entity"
import {
    UserXpProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-xp-projection.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    createProjectionCdcWorld,
    type ProjectionCdcWorld,
} from "@tests/helpers/projection-cdc-world"

describe("projection CDC routing",
    () => {
        let world: ProjectionCdcWorld

        beforeAll(async () => {
            world = await createProjectionCdcWorld()
        })

        afterAll(async () => {
            await world.close()
        })

        it("routes real Kafka CDC records through production listeners into progress and XP read models",
            async () => {
                // ARRANGE may write source-of-truth rows directly. No projection
                // service is called: the only trigger below is the real broker.
                const user = await world.entityManager.save(
                    world.entityManager.create(UserEntity,
                        {
                            keycloakId: "kc-projection-cdc-routing",
                            coinBalance: 11,
                        }),
                )
                const course = await world.entityManager.save(
                    world.entityManager.create(CourseEntity,
                        {
                            title: "CDC Routing",
                            displayId: "projection-cdc-routing-e2e",
                            description: "Projection CDC operational fixture",
                            originalPrice: 100_000,
                            defaultLocale: Locale.En,
                        }),
                )
                const enrollment = await world.entityManager.save(
                    world.entityManager.create(EnrollmentEntity,
                        {
                            user,
                            course,
                            pricingPhase: PricingPhase.Regular,
                            isEnrolled: true,
                        }),
                )
                await world.entityManager.save(
                    world.entityManager.create(XpHistoryEntity,
                        {
                            user,
                            course,
                            source: XpSource.Challenge,
                            amount: 17,
                            points: 5,
                            refId: "projection-cdc-routing-xp",
                        }),
                )

                expect(await world.entityManager.count(
                    UserCourseProgressProjectionEntity,
                )).toBe(0)
                expect(await world.entityManager.count(
                    UserXpProjectionEntity,
                )).toBe(0)

                // ACT: publish standard Debezium change envelopes. Kafka
                // transport, topic routing, consumer groups and listeners stay
                // real; only the external CDC producer is represented here.
                await world.publishChange("enrollments",
                    {
                        id: enrollment.id,
                        user_id: user.id,
                        course_id: course.id,
                        is_enrolled: true,
                    })
                await world.publishChange("xp_histories",
                    {
                        user_id: user.id,
                        course_id: course.id,
                        source: XpSource.Challenge,
                        amount: 17,
                    })

                await until(async () => {
                    const progress = await world.entityManager.findOne(
                        UserCourseProgressProjectionEntity,
                        {
                            where: {
                                userId: user.id,
                                courseId: course.id,
                            },
                        },
                    )
                    const xp = await world.entityManager.findOne(
                        UserXpProjectionEntity,
                        {
                            where: {
                                userId: user.id,
                            },
                        },
                    )
                    return progress !== null && xp !== null
                },
                {
                    timeout: 30_000,
                    describe: "CDC listeners to persist both projection rows",
                })

                // ASSERT the durable consequence, not consumer calls or offsets.
                const progress = await world.entityManager.findOneOrFail(
                    UserCourseProgressProjectionEntity,
                    {
                        where: {
                            userId: user.id,
                            courseId: course.id,
                        },
                    },
                )
                expect(progress.enrollmentId).toBe(enrollment.id)
                expect(progress.value).toEqual({
                    totalScore: 0,
                    completedChallenges: 0,
                    lessonsRead: 0,
                    milestoneProgress: 0,
                    totalXp: 0,
                })

                const xp = await world.entityManager.findOneOrFail(
                    UserXpProjectionEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    },
                )
                expect(xp.value).toEqual({
                    challengeXp: 17,
                    milestoneXp: 0,
                    codingXp: 0,
                    lessonXp: 0,
                    totalPoints: 17,
                    coinBalance: 11,
                })
            })
    })
