import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    CourseGithubTeamSlugNotMappedException,
} from "@modules/platform/exceptions/errors/courses/course-github-team-slug-not-mapped"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    MissingRequiredParameterException,
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    EnqueueResolveGithubJobService,
} from "./resolve-github.service"

// the UX delay is a real timer in production; stub it so the fire-and-forget
// broker push settles on the next tick instead of after a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

// only the course -> team-slug map is dialled per test; the rest of the env tree
// stays real so unrelated modules in the import graph keep their defaults
jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual<typeof import("@modules/platform/env/config")>(
            "@modules/platform/env/config",
        )
        return {
            ...actual,
            envConfig: jest.fn(actual.envConfig),
        }
    })

const mockEnvConfig = envConfig as jest.MockedFunction<typeof envConfig>

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.ResolveGithub].name

describe("EnqueueResolveGithubJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueResolveGithubJobService
        let queue: {
            add: jest.Mock
        }
        let jobActionService: {
            createJob: jest.Mock
            failJob: jest.Mock
        }
        let superJson: {
            stringify: jest.Mock
            parse: jest.Mock
        }
        let entityManager: EntityManagerMock

        /** The persisted jobs row `createJob` hands back. */
        const job = {
            id: "job-1",
            payload: "serialized-payload",
        }

        /**
         * Point the env's course-slug -> team-slug map at the given entries.
         *
         * @param teamSlugsByCourseSlug - The mapping the service will consult
         */
        const setTeamSlugMap = (
            teamSlugsByCourseSlug: Record<string, string>,
        ): void => {
            const real = jest.requireActual<typeof import("@modules/platform/env/config")>(
                "@modules/platform/env/config",
            ).envConfig()
            mockEnvConfig.mockReturnValue({
                ...real,
                services: {
                    ...real.services,
                    github: {
                        ...real.services.github,
                        teamSlugsByCourseSlug,
                    },
                },
            })
        }

        /**
         * Let the fire-and-forget `sleepEnqueueUxDelay().then(...)` chain settle.
         * A macrotask tick, not a wait: the stubbed delay is already resolved.
         */
        const settleBrokerPush = async (): Promise<void> =>
            new Promise<void>((resolve) => {
                setImmediate(resolve)
            })

        beforeEach(async () => {
            setTeamSlugMap({
                "fullstack-mastery": "fullstack-team",
            })

            queue = {
                add: jest.fn().mockResolvedValue(undefined),
            }
            jobActionService = {
                createJob: jest.fn().mockResolvedValue(job),
                failJob: jest.fn().mockResolvedValue(undefined),
            }
            superJson = {
                stringify: jest.fn().mockReturnValue("serialized-payload"),
                parse: jest.fn(),
            }
            entityManager = makeEntityManagerMock()

            testingModule = await Test.createTestingModule({
                providers: [
                    EnqueueResolveGithubJobService,
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
                    },
                    {
                        provide: SUPERJSON,
                        useValue: superJson,
                    },
                    {
                        provide: getQueueToken(QUEUE_NAME),
                        useValue: queue as unknown as Queue<string>,
                    },
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = testingModule.get(EnqueueResolveGithubJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("team slug resolution",
            () => {
                it("uses an explicit team slug without touching the database",
                    async () => {
                        const created = await service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })

                        expect(created).toBe(job)
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })
                        expect(jobActionService.createJob).toHaveBeenCalledWith({
                            id: expect.any(String),
                            userId: "user-1",
                            actionType: ActionType.ResolveGithub,
                            maxSteps: 3,
                            payload: "serialized-payload",
                        })
                    })

                it("derives the team slug from the course when none is given",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "course-1",
                            displayId: "fullstack-mastery",
                        })

                        await service.enqueue({
                            userId: "user-1",
                            courseId: "course-1",
                            githubUsername: "learner",
                        })

                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            CourseEntity,
                            {
                                where: {
                                    id: "course-1",
                                },
                            },
                        )
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "fullstack-team",
                        })
                    })

                it("rejects when neither a team slug nor a course id is given",
                    async () => {
                        await expect(service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                        })).rejects.toBeInstanceOf(MissingRequiredParameterException)
                        expect(jobActionService.createJob).not.toHaveBeenCalled()
                    })

                it("rejects when the course id matches no row",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        await expect(service.enqueue({
                            userId: "user-1",
                            courseId: "missing-course",
                            githubUsername: "learner",
                        })).rejects.toBeInstanceOf(CourseNotFoundException)
                        expect(jobActionService.createJob).not.toHaveBeenCalled()
                    })

                it("rejects when the course has no team-slug mapping",
                    async () => {
                        setTeamSlugMap({
                        })
                        entityManager.findOne.mockResolvedValue({
                            id: "course-1",
                            displayId: "fullstack-mastery",
                        })

                        await expect(service.enqueue({
                            userId: "user-1",
                            courseId: "course-1",
                            githubUsername: "learner",
                        })).rejects.toBeInstanceOf(CourseGithubTeamSlugNotMappedException)
                        expect(jobActionService.createJob).not.toHaveBeenCalled()
                    })
            })

        describe("broker push",
            () => {
                it("pushes the job to the broker pinned to the row id",
                    async () => {
                        await service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })
                        await settleBrokerPush()

                        expect(queue.add).toHaveBeenCalledWith(
                            "job-1",
                            "serialized-payload",
                            {
                                jobId: "job-1",
                            },
                        )
                        expect(jobActionService.failJob).not.toHaveBeenCalled()
                    })

                it("marks the job failed when the broker push rejects",
                    async () => {
                        queue.add.mockRejectedValue(new Error("redis down"))

                        await service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })
                        await settleBrokerPush()

                        expect(jobActionService.failJob).toHaveBeenCalledWith({
                            job,
                            error: "Failed to enqueue job to broker: redis down",
                        })
                    })

                it("falls back to `unknown error` when the rejection carries no message",
                    async () => {
                        queue.add.mockRejectedValue(undefined)

                        await service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })
                        await settleBrokerPush()

                        expect(jobActionService.failJob).toHaveBeenCalledWith({
                            job,
                            error: "Failed to enqueue job to broker: unknown error",
                        })
                    })

                it("returns without waiting for the broker push to settle",
                    async () => {
                        queue.add.mockReturnValue(new Promise<void>(() => {
                        }))

                        await expect(service.enqueue({
                            userId: "user-1",
                            githubUsername: "learner",
                            teamSlug: "direct-team",
                        })).resolves.toBe(job)
                    })
            })
    })
