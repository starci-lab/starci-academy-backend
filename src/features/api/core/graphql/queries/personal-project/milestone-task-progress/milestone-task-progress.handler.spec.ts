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
    MilestoneTaskProgressHandler,
} from "./milestone-task-progress.handler"
import {
    MilestoneTaskProgressQuery,
} from "./milestone-task-progress.query"
import {
    PersonalProjectProgressService,
    UserService,
} from "@modules/bussiness"
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

describe("MilestoneTaskProgressHandler",
    () => {
        let module: TestingModule
        let handler: MilestoneTaskProgressHandler
        let entityManager: EntityManagerMock
        let userService: jest.Mocked<UserService>
        let personalProjectProgressService: jest.Mocked<Pick<PersonalProjectProgressService, "getProgress">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            // userService is injected but unused by the read path -- a bare stub is enough
            userService = {
            } as unknown as jest.Mocked<UserService>

            personalProjectProgressService = {
                getProgress: jest.fn(),
            } as unknown as jest.Mocked<Pick<PersonalProjectProgressService, "getProgress">>

            module = await Test.createTestingModule({
                providers: [
                    MilestoneTaskProgressHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: PersonalProjectProgressService,
                        useValue: personalProjectProgressService,
                    },
                ],
            }).compile()

            handler = module.get<MilestoneTaskProgressHandler>(MilestoneTaskProgressHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user",
            async () => {
                await expect(
                    handler.execute(
                        new MilestoneTaskProgressQuery({
                            request: {
                                courseId: "course-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("returns an empty progress shape when the user is not enrolled",
            async () => {
                // default findOne resolves null -> no enrollment
                const result = await handler.execute(
                    new MilestoneTaskProgressQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    completionTasks: [],
                    currentTask: null,
                })
                // never delegates to the progress service without an enrollment
                expect(personalProjectProgressService.getProgress).not.toHaveBeenCalled()
            })

        it("delegates to the progress service with the resolved enrollment id",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "enr-1",
                })
                const progress = {
                    completionTasks: [
                        {
                            id: "t1",
                        },
                    ],
                    currentTask: {
                        id: "t2",
                    },
                }
                personalProjectProgressService.getProgress.mockResolvedValueOnce(
                    progress as never,
                )

                const result = await handler.execute(
                    new MilestoneTaskProgressQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(personalProjectProgressService.getProgress).toHaveBeenCalledWith({
                    enrollmentId: "enr-1",
                    courseId: "course-1",
                })
                expect(result).toBe(progress)
            })
    })
