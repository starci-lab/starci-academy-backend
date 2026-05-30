import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LeaderboardListener,
} from "./leaderboard.listener"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    ChallengeSubmissionProgressUpdatedEventPayload,
} from "@modules/event"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    LeaderboardService,
} from "@modules/bussiness"
import type {
    EntityManager,
} from "typeorm"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Pull the listener callback registered via `EventEmitterService.on(...)`.
 * Verifies the event name + returns the handler so each test can invoke it.
 */
const captureRegisteredHandler = (
    listener: LeaderboardListener,
    eventEmitterService: jest.Mocked<EventEmitterService>,
) => {
    listener.onModuleInit()
    expect(eventEmitterService.on).toHaveBeenCalledTimes(1)
    const arg = (eventEmitterService.on.mock.calls[0]?.[0] ?? {
    }) as {
        event: EventName
        listener: (
            payload: ChallengeSubmissionProgressUpdatedEventPayload,
        ) => Promise<void>
    }
    expect(arg.event).toBe(EventName.ChallengeSubmissionProgressUpdated)
    return arg.listener
}

describe("LeaderboardListener",
    () => {
        let module: TestingModule
        let listener: LeaderboardListener
        let eventEmitterService: jest.Mocked<EventEmitterService>
        let leaderboardService: jest.Mocked<LeaderboardService>
        let cacheService: jest.Mocked<CacheService>
        let entityManager: jest.Mocked<Pick<EntityManager, "findOne">>

        beforeEach(async () => {
            eventEmitterService = {
                on: jest.fn(),
            } as unknown as jest.Mocked<EventEmitterService>

            leaderboardService = {
                updateLeaderboard: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<LeaderboardService>

            cacheService = {
                get: jest.fn(),
                set: jest.fn().mockResolvedValue(undefined),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            entityManager = {
                findOne: jest.fn(),
            } as unknown as jest.Mocked<Pick<EntityManager, "findOne">>

            module = await Test.createTestingModule({
                providers: [
                    LeaderboardListener,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: LeaderboardService,
                        useValue: leaderboardService,
                    },
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            listener = module.get<LeaderboardListener>(LeaderboardListener)
        })

        afterEach(async () => {
            await module.close()
        })

        it("registers a listener for ChallengeSubmissionProgressUpdated on init",
            () => {
                listener.onModuleInit()

                expect(eventEmitterService.on).toHaveBeenCalledTimes(1)
                const arg = eventEmitterService.on.mock.calls[0][0] as {
            event: EventName
        }
                expect(arg.event).toBe(EventName.ChallengeSubmissionProgressUpdated)
            })

        it("no-ops when the enrollment payload references a missing enrollment",
            async () => {
                const handler = captureRegisteredHandler(listener,
                    eventEmitterService)
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler({
                    enrollmentId: "missing",
                })

                expect(leaderboardService.updateLeaderboard).not.toHaveBeenCalled()
                expect(cacheService.set).not.toHaveBeenCalled()
            })

        it("acquires the debounce flag and recomputes when no flag is present",
            async () => {
                const handler = captureRegisteredHandler(listener,
                    eventEmitterService)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "e1",
                    courseId: "course-1",
         
                } as any)
                cacheService.get.mockResolvedValueOnce(undefined)

                await handler({
                    enrollmentId: "e1",
                })

                expect(cacheService.get).toHaveBeenCalledWith({
                    key: CacheKey.CourseLeaderboardDebounce,
                    args: ["course-1"],
                })
                expect(cacheService.set).toHaveBeenCalledWith({
                    key: CacheKey.CourseLeaderboardDebounce,
                    args: ["course-1"],
                    cacheResult: true,
                })
                expect(leaderboardService.updateLeaderboard).toHaveBeenCalledWith("course-1")
            })

        it("drops the event when the debounce flag is already set",
            async () => {
                const handler = captureRegisteredHandler(listener,
                    eventEmitterService)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "e1",
                    courseId: "course-1",
         
                } as any)
                cacheService.get.mockResolvedValueOnce(true)

                await handler({
                    enrollmentId: "e1",
                })

                expect(cacheService.set).not.toHaveBeenCalled()
                expect(leaderboardService.updateLeaderboard).not.toHaveBeenCalled()
            })

        it("only the first of N concurrent events on the same course performs the recompute",
            async () => {
                const handler = captureRegisteredHandler(listener,
                    eventEmitterService)
                entityManager.findOne.mockResolvedValue({
                    id: "e1",
                    courseId: "course-1",
         
                } as any)
                cacheService.get
                    .mockResolvedValueOnce(undefined)
                    .mockResolvedValueOnce(true)
                    .mockResolvedValueOnce(true)

                await Promise.all([
                    handler({
                        enrollmentId: "e1",
                    }),
                    handler({
                        enrollmentId: "e1",
                    }),
                    handler({
                        enrollmentId: "e1",
                    }),
                ])

                expect(leaderboardService.updateLeaderboard).toHaveBeenCalledTimes(1)
            })
    })
