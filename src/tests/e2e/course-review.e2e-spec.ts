import {
    createProjectionCdcWorld,
} from "@tests/helpers/projection-cdc-world"
import type {
    ProjectionCdcWorld,
} from "@tests/helpers/projection-cdc-world"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    CourseReviewStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/course-review-stats-projection.entity"

/** The course under review across the whole flow. */
const COURSE_ID = "8f1c2d34-0000-4000-8000-000000000001"

/** The learner who writes the reviews. */
const LEARNER_ID = "8f1c2d34-0000-4000-8000-000000000002"

/** How long the projection is allowed to take before the flow calls it broken. */
const SETTLE_TIMEOUT_MS = 20_000

/**
 * Read the course's aggregate straight out of the read model.
 *
 * @param world - The booted CDC world.
 * @returns The parsed aggregate, or nulls when no projection row exists yet.
 */
const readAggregate = async (
    world: ProjectionCdcWorld,
): Promise<{ averageScore: number | null, reviewCount: number | null }> => {
    const row = await world.entityManager.findOne(
        CourseReviewStatsProjectionEntity,
        {
            where: {
                courseId: COURSE_ID,
            },
        },
    )
    const value = row?.value ?? {
    }
    return {
        averageScore: value.averageScore === undefined ? null : Number(value.averageScore),
        reviewCount: value.reviewCount === undefined ? null : Number(value.reviewCount),
    }
}

describe("a course's rating follows its reviews through CDC",
    () => {
        let world: ProjectionCdcWorld

        beforeAll(async () => {
            world = await createProjectionCdcWorld()

            // the flow mints its own course and learner rather than leaning on a seeded id.
            // FLOW-9 is the rule, and the reason shows up the first time two flows pick the same
            // magic ordinal and one of them starts failing only when both run
            await world.entityManager.query(
                "DELETE FROM course_review_stats_projections WHERE course_id = $1",
                [
                    COURSE_ID,
                ],
            )
            await world.entityManager.query(
                "DELETE FROM course_reviews WHERE course_id = $1",
                [
                    COURSE_ID,
                ],
            )
            await world.entityManager.query(
                `INSERT INTO users (id, keycloak_id)
                 VALUES ($1, $2)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    LEARNER_ID,
                    `course-review-e2e-${LEARNER_ID}`,
                ],
            )
            await world.entityManager.query(
                `INSERT INTO courses (id, title, display_id, description, original_price, default_locale)
                 VALUES ($1, $2, $3, $4, 0, 'en'::locale)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    COURSE_ID,
                    "Course review e2e",
                    `course-review-e2e-${COURSE_ID}`,
                    "Minted by the course-review flow.",
                ],
            )
        },
        120_000)

        afterAll(async () => {
            await world.close()
        })

        it("has no rating before anybody has reviewed",
            async () => {
            // the negative first: a flow that only asserts what SHOULD arrive cannot catch a
            // projection that invents a rating out of an empty table
                const {
                    reviewCount,
                } = await readAggregate(world)

                expect(reviewCount).toBeNull()
            })

        it("rates the course once the first review lands",
            async () => {
                await world.entityManager.query(
                    `INSERT INTO course_reviews (id, course_id, user_id, score, body)
                 VALUES (gen_random_uuid(), $1, $2, 5, 'the caching module carried it')`,
                    [
                        COURSE_ID,
                        LEARNER_ID,
                    ],
                )

                // the source write alone changes NOTHING a reader sees. Only the broker delivery does,
                // which is the whole subject of this lane -- and the trap that makes a seeded database
                // look like a broken read path
                await world.publishChange("course_reviews",
                    {
                        course_id: COURSE_ID,
                    })

                await until(
                    async () => (await readAggregate(world)).reviewCount === 1,
                    {
                        timeout: SETTLE_TIMEOUT_MS,
                        describe: "the review aggregate to rebuild after the first review",
                    },
                )

                const {
                    averageScore,
                } = await readAggregate(world)
                expect(averageScore).toBe(5)
            })

        it("averages the second review in rather than replacing the first",
            async () => {
                await world.entityManager.query(
                    `INSERT INTO course_reviews (id, course_id, user_id, score, body)
                 VALUES (gen_random_uuid(), $1, $2, 3, 'the last two modules dragged')`,
                    [
                        COURSE_ID,
                        LEARNER_ID,
                    ],
                )
                await world.publishChange("course_reviews",
                    {
                        course_id: COURSE_ID,
                    })

                await until(
                    async () => (await readAggregate(world)).reviewCount === 2,
                    {
                        timeout: SETTLE_TIMEOUT_MS,
                        describe: "the review aggregate to take in the second review",
                    },
                )

                // both rows by the SAME learner, which is the feature: a second opinion is a second
                // review, and an aggregate that kept only the latest would answer 3 here
                const {
                    averageScore,
                } = await readAggregate(world)
                expect(averageScore).toBe(4)
            })

        it("survives a duplicate delivery without moving the rating",
            async () => {
            // the case CDC-4 exists for. A projection that incremented by the event's delta would
            // read 3 reviews here, and the average would drift with every redelivery -- silently,
            // because nothing else in the system disagrees with a projection
                await world.publishChange("course_reviews",
                    {
                        course_id: COURSE_ID,
                    })
                await world.publishChange("course_reviews",
                    {
                        course_id: COURSE_ID,
                    })

                await until(
                    async () => (await readAggregate(world)).reviewCount === 2,
                    {
                        timeout: SETTLE_TIMEOUT_MS,
                        describe: "the aggregate to stay at two reviews after redelivery",
                    },
                )

                const {
                    averageScore,
                    reviewCount,
                } = await readAggregate(world)
                expect(reviewCount).toBe(2)
                expect(averageScore).toBe(4)
            })

        it("falls back to the surviving review when one is removed",
            async () => {
                await world.entityManager.query(
                    "DELETE FROM course_reviews WHERE course_id = $1 AND score = 3",
                    [
                        COURSE_ID,
                    ],
                )
                await world.publishChange("course_reviews",
                    {
                        course_id: COURSE_ID,
                    })

                await until(
                    async () => (await readAggregate(world)).reviewCount === 1,
                    {
                        timeout: SETTLE_TIMEOUT_MS,
                        describe: "the aggregate to drop the removed review",
                    },
                )

                const {
                    averageScore,
                } = await readAggregate(world)
                expect(averageScore).toBe(5)
            })
    })
