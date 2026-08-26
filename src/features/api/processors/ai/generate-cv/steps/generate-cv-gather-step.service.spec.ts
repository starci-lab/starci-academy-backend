import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    extractCvText,
} from "./extract-cv-text"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    GenerateCvGatherStepService,
} from "./generate-cv-gather-step.service"

jest.mock("./extract-cv-text",
    () => ({
        extractCvText: jest.fn()
    }))

const selectedEvidence = [{
    milestoneTaskAttemptId: "attempt-1",
    milestoneTaskId: "task-1",
    milestoneId: "milestone-1",
    courseId: "course-1",
    taskTitle: "Build an API",
    milestoneTitle: "Backend capstone",
    courseTitle: "Fullstack Master",
    score: 92,
    passedAt: "2026-08-01T00:00:00.000Z",
}]

const context = (overrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "job-1"
    },
    queueName: "generate-cv",
    payload: {
        jobId: "job-1",
        cvGenerationId: "cv-1",
        userId: "user-1",
        mode: CvGenerationMode.Generate,
        language: Locale.En,
        targetLevel: CvTargetLevel.Mid,
        selectedEvidence,
        ...overrides,
    },
    extended: {
        cvGeneration: {
            id: "cv-1"
        }
    },
}) as never

describe("GenerateCvGatherStepService",
    () => {
        const makeService = () => {
            const entityManager = makeEntityManagerMock()
            entityManager.findOneOrFail.mockResolvedValue({
                displayName: "Jane",
                bio: null,
                roleTitle: "Engineer",
                location: "HCM",
                linkedinUrl: null,
                websiteUrl: null,
                githubUsername: "jane",
                workMode: "remote",
                openToWork: true,
            })
            const jobAction = {
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
                failJob: jest.fn(),
            }
            const s3 = {
                buffer: jest.fn()
            }
            const service = new GenerateCvGatherStepService(
                asEntityManager(entityManager),
                jobAction as never,
                {
                    log: jest.fn()
                } as never,
                s3 as never,
            )
            return {
                entityManager, jobAction, s3, service
            }
        }

        it("persists only the frozen selected snapshot and profile for generate mode",
            async () => {
                const { entityManager, jobAction, s3, service } = makeService()

                await service.process(context())

                // read back the exact blob this step handed the persistence
                // collaborator -- a captured value, asserted with `toEqual`,
                // rather than a partial `toHaveBeenCalledWith` match
                const [[saved]] = jobAction.saveExecutionResult.mock.calls
                expect(saved.key).toBe("gather")
                expect(saved.executionResult).toEqual({
                    profile: {
                        displayName: "Jane",
                        bio: null,
                        roleTitle: "Engineer",
                        location: "HCM",
                        linkedinUrl: null,
                        websiteUrl: null,
                        githubUsername: "jane",
                        workMode: "remote",
                        openToWork: true,
                    },
                    selectedEvidence,
                    sourceCvText: null,
                })
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(entityManager.query).not.toHaveBeenCalled()
                expect(s3.buffer).not.toHaveBeenCalled()
            })

        it("keeps an explicit empty evidence list empty",
            async () => {
                const { jobAction, service } = makeService()

                await service.process(context({
                    selectedEvidence: []
                }))

                const [[saved]] = jobAction.saveExecutionResult.mock.calls
                expect(saved.executionResult.selectedEvidence).toEqual([])
            })

        it("serializes a generated source CV in revise mode",
            async () => {
                const { entityManager, jobAction, service } = makeService()
                entityManager.findOne.mockResolvedValueOnce({
                    source: CvSource.Generated,
                    structuredData: {
                        headline: "Existing CV"
                    },
                })

                await service.process(context({
                    mode: CvGenerationMode.Revise,
                    sourceCvSubmissionId: "source-cv",
                }))

                const [[saved]] = jobAction.saveExecutionResult.mock.calls
                // exact serialization, not a substring -- catches a formatting
                // regression (e.g. dropped `null, 2` indentation) the old
                // `stringContaining` check could never see
                expect(saved.executionResult.sourceCvText).toBe(JSON.stringify(
                    {
                        headline: "Existing CV"
                    },
                    null,
                    2,
                ))
            })

        it("extracts an uploaded source CV in revise mode",
            async () => {
                const { entityManager, jobAction, s3, service } = makeService()
                entityManager.findOne.mockResolvedValueOnce({
                    source: CvSource.Uploaded,
                    uploadedCdnKey: "cv/source.pdf",
                })
                s3.buffer.mockResolvedValueOnce(Buffer.from("pdf"))
                jest.mocked(extractCvText).mockResolvedValueOnce("Original experience")

                await service.process(context({
                    mode: CvGenerationMode.Revise,
                    sourceCvSubmissionId: "source-cv",
                }))

                const [[saved]] = jobAction.saveExecutionResult.mock.calls
                expect(saved.executionResult.sourceCvText).toBe("Original experience")
            })

        it("preserves an empty uploaded CV extraction result",
            async () => {
                const { service, jobAction } = makeService()
                jest.mocked(extractCvText).mockResolvedValueOnce("")

                await service.process(context({
                    mode: CvGenerationMode.Revise,
                    source: CvSource.Uploaded,
                }))

                const [[saved]] = jobAction.saveExecutionResult.mock.calls
                expect(saved.executionResult.sourceCvText).toBeNull()
                expect(extractCvText).toHaveBeenCalled()
            })
    })
