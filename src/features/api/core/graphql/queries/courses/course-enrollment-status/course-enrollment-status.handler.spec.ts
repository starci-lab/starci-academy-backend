// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see course.handler.spec.ts for the full rationale).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CourseEnrollmentStatusHandler,
} from "./course-enrollment-status.handler"
import {
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in carrying only the id the handler reads. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("CourseEnrollmentStatusHandler",
    () => {
        let module: TestingModule
        let handler: CourseEnrollmentStatusHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    CourseEnrollmentStatusHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<CourseEnrollmentStatusHandler>(CourseEnrollmentStatusHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when the request has no authenticated user",
            async () => {
                await expect(
                    handler.execute(
                        new CourseEnrollmentStatusQuery({
                            request: {
                                courseId: "course-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("reports enrolled with the row when a matching real-enrollment row exists",
            async () => {
                // `isEnrolled` reflects the row's own flag (see handler comment), so the
                // mock row must carry `isEnrolled: true` to represent a real enrollment.
                const enrollment = {
                    id: "enr-1",
                    isEnrolled: true,
                }
                entityManager.findOne.mockResolvedValueOnce(enrollment)

                const result = await handler.execute(
                    new CourseEnrollmentStatusQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.isEnrolled).toBe(true)
                expect(result.enrollment).toBe(enrollment)
            })

        it("reports not-enrolled with the row when a trial/preview row exists",
            async () => {
                // A trial/preview row exists (is_enrolled = false) so the FE should still
                // show the enroll / buy CTA, even though a row was returned.
                const enrollment = {
                    id: "enr-2",
                    isEnrolled: false,
                }
                entityManager.findOne.mockResolvedValueOnce(enrollment)

                const result = await handler.execute(
                    new CourseEnrollmentStatusQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.isEnrolled).toBe(false)
                expect(result.enrollment).toBe(enrollment)
            })

        it("reports not-enrolled with a null row when no enrollment exists",
            async () => {
                // default findOne resolves null → user is not enrolled
                const result = await handler.execute(
                    new CourseEnrollmentStatusQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.isEnrolled).toBe(false)
                expect(result.enrollment).toBeNull()
            })
    })
