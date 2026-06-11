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
    CodingLanguage,
    CodingSubmissionEntity,
    CodingVerdict,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "../jobs"
import {
    AntiCheatService,
} from "../anti-cheat"
import {
    DeviceService,
} from "../device"
import {
    makeEntityManagerMock,
} from "@tests/utils"
import type {
    EntityManagerMock,
} from "@tests/utils"

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
        let antiCheatService: jest.Mocked<Pick<AntiCheatService, "evaluate">>
        let deviceService: jest.Mocked<Pick<DeviceService, "recordDevice">>

        const userId = "user-1"
        const slug = "two-sum"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // findAndCount is not part of the shared mock — add it for the history path
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

            // anti-cheat stub: a clean evaluation by default
            antiCheatService = {
                evaluate: jest.fn(() => ({
                    suspicionScore: 0,
                    flagged: false,
                    reasons: [],
                })),
            } as unknown as jest.Mocked<Pick<AntiCheatService, "evaluate">>

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
                        provide: AntiCheatService,
                        useValue: antiCheatService,
                    },
                    {
                        provide: DeviceService,
                        useValue: deviceService,
                    },
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
                        // findOne default resolves null → no matching enabled problem
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

                it("stamps the anti-cheat verdict + telemetry onto the submission",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "problem-1",
                        })
                        entityManager.save.mockResolvedValueOnce({
                            id: "submission-1",
                        })
                        // a flagged evaluation should be written through to the row
                        antiCheatService.evaluate.mockReturnValueOnce({
                            suspicionScore: 80,
                            flagged: true,
                            reasons: [
                                "pasted",
                            ],
                        })

                        await service.submit({
                            userId,
                            slug,
                            language: CodingLanguage.Python,
                            sourceCode: "print(1)",
                            telemetry: {
                                pasteCount: 9,
                            },
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                            fingerprint: "fp-1",
                        })

                        // anti-cheat scored the attempt using the final code length
                        expect(antiCheatService.evaluate).toHaveBeenCalledWith({
                            telemetry: {
                                pasteCount: 9,
                            },
                            codeLength: "print(1)".length,
                        })
                        const saved = entityManager.save.mock.calls[0][1] as {
                            suspicionScore: number
                            flaggedForReview: boolean
                            clientTelemetry: string | null
                            ipAddress: string | null
                        }
                        expect(saved.suspicionScore).toBe(80)
                        expect(saved.flaggedForReview).toBe(true)
                        expect(saved.ipAddress).toBe("1.2.3.4")
                        // telemetry is serialized together with the computed reasons
                        expect(JSON.parse(saved.clientTelemetry as string)).toEqual({
                            pasteCount: 9,
                            reasons: [
                                "pasted",
                            ],
                        })
                    })

                it("stores null telemetry when the client supplied none",
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
                        })

                        const saved = entityManager.save.mock.calls[0][1] as {
                            clientTelemetry: string | null
                        }
                        // no telemetry object → nothing to serialize
                        expect(saved.clientTelemetry).toBeNull()
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
            })

        describe("listMine",
            () => {
                it("throws CodingProblemNotFoundException for an unknown/disabled slug",
                    async () => {
                        // findOne default resolves null → no matching problem
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
    })
