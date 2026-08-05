// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LastPersonalTaskAttemptHandler,
} from "./last-personal-task-attempt.handler"
import {
    LastPersonalTaskAttemptQuery,
} from "./last-personal-task-attempt.query"
import {
    PersonalTaskAttemptAccessDeniedException,
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

/** A keycloak token stub exposing only the realm roles the guard inspects. */
const tokenWithRoles = (
    roles: Array<string>,
): never => ({
    realm_access: {
        roles,
    },
}) as never

describe("LastPersonalTaskAttemptHandler",
    () => {
        let module: TestingModule
        let handler: LastPersonalTaskAttemptHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    LastPersonalTaskAttemptHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<LastPersonalTaskAttemptHandler>(LastPersonalTaskAttemptHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated caller",
            async () => {
                await expect(
                    handler.execute(
                        new LastPersonalTaskAttemptQuery({
                            request: {
                                courseId: "course-1",
                                taskId: "task-1",
                                userId: "u1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("forbids reading another user's attempt without a privileged role",
            async () => {
                await expect(
                    handler.execute(
                        new LastPersonalTaskAttemptQuery({
                            request: {
                                courseId: "course-1",
                                taskId: "task-1",
                                userId: "subject",
                            },
                            user: fakeUser("caller"),
                            keycloakToken: tokenWithRoles([
                                "student",
                            ]),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PersonalTaskAttemptAccessDeniedException)
            })

        it("allows staff roles to read another user's attempt",
            async () => {
                // enrollment + user-task resolve, then the latest attempt is returned
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "enr-1",
                    })
                    .mockResolvedValueOnce({
                        id: "umt-1",
                    })
                    .mockResolvedValueOnce({
                        id: "attempt-9",
                    })

                const result = await handler.execute(
                    new LastPersonalTaskAttemptQuery({
                        request: {
                            courseId: "course-1",
                            taskId: "task-1",
                            userId: "subject",
                        },
                        user: fakeUser("caller"),
                        keycloakToken: tokenWithRoles([
                            "instructor",
                        ]),
                    }),
                )

                expect(result.attempt).toEqual({
                    id: "attempt-9",
                })
            })

        it("returns a null attempt when the subject has no enrollment",
            async () => {
                // first findOne (enrollment) resolves null
                const result = await handler.execute(
                    new LastPersonalTaskAttemptQuery({
                        request: {
                            courseId: "course-1",
                            taskId: "task-1",
                            userId: "self",
                        },
                        // caller reads their own attempt -> role check passes
                        user: fakeUser("self"),
                    }),
                )

                expect(result.attempt).toBeNull()
            })

        it("returns a null attempt when no user-milestone-task row exists",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "enr-1",
                    })
                    // user-milestone-task lookup misses
                    .mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new LastPersonalTaskAttemptQuery({
                        request: {
                            courseId: "course-1",
                            taskId: "task-1",
                            userId: "self",
                        },
                        user: fakeUser("self"),
                    }),
                )

                expect(result.attempt).toBeNull()
            })
    })
