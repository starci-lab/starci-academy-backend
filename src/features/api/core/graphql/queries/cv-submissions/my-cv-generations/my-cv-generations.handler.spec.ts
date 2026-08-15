import "@modules/bussiness/bussiness.module"
import {
    CvEvidenceService,
} from "@modules/bussiness/cv-evidence/cv-evidence.service"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CvEvidenceLevel,
} from "@modules/databases/postgresql/primary/enums/cv-evidence-level"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    MyCvGenerationsHandler,
} from "./my-cv-generations.handler"
import {
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"

describe("MyCvGenerationsHandler",
    () => {
        it("returns empty without a database read when unauthenticated",
            async () => {
                const entityManager = makeEntityManagerMock()
                const evidence = {
                    parseSnapshot: jest.fn(),
                    evidenceLevel: jest.fn(),
                } as unknown as CvEvidenceService
                const handler = new MyCvGenerationsHandler(asEntityManager(entityManager),
                    evidence)

                await expect(handler.execute(new MyCvGenerationsQuery({
                    request: {
                        limit: 20, offset: 0 
                    },
                    user: undefined,
                }))).resolves.toEqual([])
                expect(entityManager.find).not.toHaveBeenCalled()
            })

        it("scopes pagination to the caller and maps lightweight evidence summaries",
            async () => {
                const entityManager = makeEntityManagerMock()
                const snapshot = [{
                    milestoneTaskAttemptId: "attempt-1" 
                }]
                const parseSnapshot = jest.fn().mockReturnValue(snapshot)
                const evidenceLevel = jest.fn().mockReturnValue(CvEvidenceLevel.CapstoneVerified)
                const handler = new MyCvGenerationsHandler(
                    asEntityManager(entityManager),
                    {
                        parseSnapshot, evidenceLevel 
                    } as unknown as CvEvidenceService,
                )
                entityManager.find.mockResolvedValueOnce([{
                    id: "cv-1",
                    mode: CvGenerationMode.Generate,
                    status: CvGenerationStatus.Done,
                    source: CvSource.Generated,
                    courseId: "course-1",
                    course: {
                        title: "Fullstack Master" 
                    },
                    label: "Backend CV",
                    targetRole: "Backend Engineer",
                    language: "en",
                    targetLevel: CvTargetLevel.Mid,
                    selectedEvidence: snapshot,
                    score: 88,
                    errorMessage: null,
                    processedAt: null,
                    createdAt: new Date("2026-08-01T00:00:00.000Z"),
                }])

                const result = await handler.execute(new MyCvGenerationsQuery({
                    request: {
                        limit: 10, offset: 2 
                    },
                    user: {
                        id: "user-1" 
                    } as UserEntity,
                }))

                expect(entityManager.find).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1" 
                            } 
                        },
                        take: 10,
                        skip: 2,
                    }))
                expect(result[0]).toEqual(expect.objectContaining({
                    targetLevel: CvTargetLevel.Mid,
                    selectedEvidenceCount: 1,
                    evidenceLevel: CvEvidenceLevel.CapstoneVerified,
                }))
                expect(evidenceLevel).toHaveBeenCalledWith(snapshot)
            })

        it("keeps legacy null target and malformed evidence as self-reported",
            async () => {
                const entityManager = makeEntityManagerMock()
                const parseSnapshot = jest.fn().mockReturnValue([])
                const evidenceLevel = jest.fn().mockReturnValue(CvEvidenceLevel.SelfReported)
                const handler = new MyCvGenerationsHandler(
                    asEntityManager(entityManager),
                    {
                        parseSnapshot, evidenceLevel 
                    } as unknown as CvEvidenceService,
                )
                entityManager.find.mockResolvedValueOnce([{
                    id: "legacy-cv",
                    mode: CvGenerationMode.Generate,
                    status: CvGenerationStatus.Done,
                    source: CvSource.Uploaded,
                    courseId: null,
                    course: null,
                    label: null,
                    targetRole: null,
                    language: null,
                    targetLevel: null,
                    selectedEvidence: {
                        malformed: true 
                    },
                    score: 70,
                    errorMessage: null,
                    processedAt: null,
                    createdAt: new Date("2026-08-01T00:00:00.000Z"),
                }])

                const [result] = await handler.execute(new MyCvGenerationsQuery({
                    request: {
                        limit: 20, offset: 0 
                    },
                    user: {
                        id: "user-1" 
                    } as UserEntity,
                }))

                expect(result.targetLevel).toBeNull()
                expect(result.selectedEvidenceCount).toBe(0)
                expect(result.evidenceLevel).toBe(CvEvidenceLevel.SelfReported)
            })
    })
