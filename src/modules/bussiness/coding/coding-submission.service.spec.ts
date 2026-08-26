import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CodingSubmissionService,
} from "./coding-submission.service"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    CodingLanguage,
} from "@modules/databases/postgresql/primary/enums/coding-language"
import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    CodingProblemNotFoundException,
} from "@modules/platform/exceptions/errors/coding/coding-problem-not-found"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "../jobs/enqueue/judge-coding-submission.service"
import {
    DeviceService,
} from "../device/device.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    winstonServiceMock,
} from "@tests/helpers/create-e2e-app"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("CodingSubmissionService",
    () => {
        let module: TestingModule
        let service: CodingSubmissionService
        let entityManager: EntityManagerMock
        let enqueueService: jest.Mocked<
            Pick<EnqueueJudgeCodingSubmissionJobService, "enqueue">
        >
        let deviceService: jest.Mocked<Pick<DeviceService, "recordDevice">>

        const userId = "user-1"
        const slug = "two-sum"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // findAndCount is not part of the shared mock -- add it for the history path
            entityManager.findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])

            // enqueue stub returns a deterministic job id
            enqueueService = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-1",
                }),
            } as unknown as jest.Mocked<
                Pick<EnqueueJudgeCodingSubmissionJobService, "enqueue">
            >

            // device recording is best-effort and returns void
            deviceService = {
                recordDevice: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<DeviceService, "recordDevice">>

            module = await Test.createTestingModule({
                providers: [
                    CodingSubmissionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EnqueueJudgeCodingSubmissionJobService,
                        useValue: enqueueService,
                    },
                    {
                        provide: DeviceService,
                        useValue: deviceService,
                    },
                    winstonServiceMock,
                ],
            }).compile()

            service = module.get<CodingSubmissionService>(CodingSubmissionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("submit",
            () => {
                it("throws CodingProblemNotFoundException for an unknown/disabled slug",
                    async () => {
                        // findOne default resolves null -> no matching enabled problem
                        await expect(
                            service.submit({
                                userId,
                                slug,
                                language: CodingLanguage.Python,
                                sourceCode: "print(1)",
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)
                        // nothing should be persisted or enqueued on the not-found path
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(enqueueService.enqueue).not.toHaveBeenCalled()
                    })

                it("persists a pending submission and enqueues the judging job",
                    async () => {
                        // problem lookup resolves an enabled row
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        // save echoes back a row carrying the generated id
                        entityManager.save.mockResolvedValueOnce({
                            id: "submission-1",
                        })

                        const result = await service.submit({
                            userId,
                            slug,
                            language: CodingLanguage.Python,
                            sourceCode: "print(1)",
                        })

                        // returns both ids the client subscribes on
                        expect(result).toEqual({
                            submissionId: "submission-1",
                            jobId: "job-1",
                        })
                        // saved a fresh submission in the pending state
                        const saved = entityManager.save.mock.calls[0][1] as {
                            verdict: CodingVerdict
                            user: {
                                id: string
                            }
                            problem: {
                                id: string
                            }
                        }
                        expect(saved.verdict).toBe(CodingVerdict.Pending)
                        expect(saved.user.id).toBe(userId)
                        expect(saved.problem.id).toBe("problem-1")
                        // enqueued the async judging job keyed by the new submission
                        expect(enqueueService.enqueue).toHaveBeenCalledWith({
                            userId,
                            codingSubmissionId: "submission-1",
                        })
                    })

                it("captures request metadata (ip/user-agent) on the submission",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        entityManager.save.mockResolvedValueOnce({
                            id: "submission-1",
                        })

                        await service.submit({
                            userId,
                            slug,
                            language: CodingLanguage.Python,
                            sourceCode: "print(1)",
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                            fingerprint: "fp-1",
                        })

                        const saved = entityManager.save.mock.calls[0][1] as {
                            ipAddress: string | null
                            userAgent: string | null
                            deviceFingerprint: string | null
                        }
                        expect(saved.ipAddress).toBe("1.2.3.4")
                        expect(saved.userAgent).toBe("ua")
                        expect(saved.deviceFingerprint).toBe("fp-1")
                    })

                it("records the originating device (best-effort)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        entityManager.save.mockResolvedValueOnce({
                            id: "submission-1",
                        })

                        await service.submit({
                            userId,
                            slug,
                            language: CodingLanguage.Python,
                            sourceCode: "print(1)",
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                            fingerprint: "fp-1",
                        })

                        expect(deviceService.recordDevice).toHaveBeenCalledWith({
                            userId,
                            fingerprint: "fp-1",
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                        })
                    })

                it("logs device failures but still enqueues the pending submission",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        entityManager.save.mockResolvedValueOnce({
                            id: "submission-1",
                        })
                        const deviceError = new Error("device store unavailable")
                        deviceService.recordDevice.mockRejectedValueOnce(deviceError)

                        await expect(service.submit({
                            userId,
                            slug,
                            language: CodingLanguage.Python,
                            sourceCode: "print(1)",
                        })).resolves.toEqual({
                            submissionId: "submission-1",
                            jobId: "job-1",
                        })
                        expect(enqueueService.enqueue).toHaveBeenCalledWith({
                            userId,
                            codingSubmissionId: "submission-1",
                        })
                        expect(winstonServiceMock.useValue.log).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                op: "coding.device-record.failed",
                                error: deviceError.message,
                            }),
                        )
                    })
            })

        describe("recordSolutionReveal",
            () => {
                it("throws when the requested problem is unavailable",
                    async () => {
                        await expect(service.recordSolutionReveal({
                            userId,
                            slug,
                        })).rejects.toBeInstanceOf(CodingProblemNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("returns an idempotent result for an existing reveal",
                    async () => {
                        const solutions = [{
                            id: "solution-1",
                        }]
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: "problem-1",
                                solutions,
                            })
                            .mockResolvedValueOnce({
                                id: "reveal-1",
                            })

                        await expect(service.recordSolutionReveal({
                            userId,
                            slug,
                        })).resolves.toEqual({
                            revealed: false,
                            solutions,
                        })
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("persists the first reveal and tolerates an absent solution list",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: "problem-1",
                            })
                            .mockResolvedValueOnce(null)

                        await expect(service.recordSolutionReveal({
                            userId,
                            slug,
                        })).resolves.toEqual({
                            revealed: true,
                            solutions: [],
                        })
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                user: {
                                    id: userId,
                                },
                                problem: {
                                    id: "problem-1",
                                },
                            },
                        )
                    })
            })

        describe("listMine",
            () => {
                it("throws CodingProblemNotFoundException for an unknown/disabled slug",
                    async () => {
                        // findOne default resolves null -> no matching problem
                        await expect(
                            service.listMine({
                                userId,
                                slug,
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)
                        expect(entityManager.findAndCount).not.toHaveBeenCalled()
                    })

                it("pages the user's submissions for the problem, newest first",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        const submissions = [
                            {
                                id: "s1",
                            },
                        ] as unknown as Array<CodingSubmissionEntity>
                        entityManager.findAndCount.mockResolvedValueOnce([
                            submissions,
                            1,
                        ])

                        const result = await service.listMine({
                            userId,
                            slug,
                            page: 2,
                            limit: 10,
                        })

                        expect(result).toEqual({
                            submissions,
                            total: 1,
                        })
                        // filters by relation ids, orders newest-first, paginates correctly
                        expect(entityManager.findAndCount).toHaveBeenCalledWith(
                            CodingSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                    problem: {
                                        id: "problem-1",
                                    },
                                },
                                order: {
                                    createdAt: "DESC",
                                },
                                skip: 10,
                                take: 10,
                            },
                        )
                    })
            })

        describe("getAcceptedSummary",
            () => {
                it("returns null when no accepted row exists",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([{
                            first_solved_at: null,
                        }])

                        await expect(service.getAcceptedSummary({
                            userId,
                            problemId: "problem-1",
                        })).resolves.toBeNull()
                    })

                it("maps the earliest accepted row and defaults nullable aggregates",
                    async () => {
                        const solvedAt = "2026-08-26T00:00:00.000Z"
                        entityManager.query.mockResolvedValueOnce([{
                            languages: null,
                            passed_count: "3",
                            total_count: "4",
                            first_solved_at: solvedAt,
                        }])

                        await expect(service.getAcceptedSummary({
                            userId,
                            problemId: "problem-1",
                        })).resolves.toEqual({
                            languages: [],
                            verdict: CodingVerdict.Accepted,
                            passedCount: 3,
                            totalCount: 4,
                            firstSolvedAt: solvedAt,
                        })
                    })
            })
    })
