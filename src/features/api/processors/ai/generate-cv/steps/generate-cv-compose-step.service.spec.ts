import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    GenerateCvComposeStepService,
} from "./generate-cv-compose-step.service"

const evidence = [{
    milestoneTaskAttemptId: "attempt-selected",
    milestoneTaskId: "task-1",
    milestoneId: "milestone-1",
    courseId: "course-1",
    taskTitle: "Selected API capstone",
    milestoneTitle: "Backend capstone",
    courseTitle: "Fullstack Master",
    score: 92,
    passedAt: "2026-08-01T00:00:00.000Z",
}]

const gathered = {
    profile: {
        displayName: "Jane",
        bio: null,
        roleTitle: "Untrusted inferred role",
        location: "HCM",
        linkedinUrl: null,
        websiteUrl: null,
        githubUsername: "jane",
        workMode: "remote",
        openToWork: true,
    },
    selectedEvidence: evidence,
    sourceCvText: null,
}

const response = JSON.stringify({
    fullName: "Jane",
    headline: "Backend Engineer",
    summary: "Ships APIs",
    skillGroups: [],
    experiences: [],
    education: [],
})

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
        selectedEvidence: evidence,
        targetRole: "Backend Engineer",
        ...overrides,
    },
    extended: {
        cvGeneration: {
            id: "cv-1" 
        } 
    },
}) as never

describe("GenerateCvComposeStepService",
    () => {
        const makeService = () => {
            const entityManager = makeEntityManagerMock()
            const loadExecutionResult = jest.fn().mockResolvedValue(gathered)
            const jobAction = {
                loadExecutionResult,
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
                failJob: jest.fn(),
            }
            const run = jest.fn().mockResolvedValue({
                text: response 
            })
            const retrieveCvContext = jest.fn().mockResolvedValue({
                excerpt: "RAG evidence" 
            })
            const service = new GenerateCvComposeStepService(
                asEntityManager(entityManager),
                jobAction as never,
                {
                    log: jest.fn() 
                } as never,
                {
                    run 
                } as never,
                {
                    retrieveCvContext 
                } as never,
            )
            return {
                jobAction, run, retrieveCvContext, service 
            }
        }

        it.each(Object.values(CvTargetLevel))("threads exact %s target, role, language and selected-only evidence",
            async (targetLevel) => {
                const { jobAction, run, retrieveCvContext, service } = makeService()

                await service.process(context({
                    targetLevel, language: Locale.Vi 
                }))

                expect(retrieveCvContext).toHaveBeenCalledWith(expect.objectContaining({
                    query: expect.stringContaining(targetLevel),
                }))
                const invocation = run.mock.calls[0][0]
                const systemPrompt = String(invocation.messages[0].content)
                const humanPrompt = String(invocation.messages[1].content)
                expect(systemPrompt).toContain(`${targetLevel} Backend Engineer`)
                expect(systemPrompt).toContain("Vietnamese")
                expect(humanPrompt).toContain("Selected API capstone")
                expect(humanPrompt).not.toContain("Untrusted inferred role")
                expect(invocation.task).toBe(AiModelTask.CVGenerating)
                expect(jobAction.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    key: "compose",
                    executionResult: expect.objectContaining({
                        headline: "Backend Engineer" 
                    }),
                }))
            })

        it("uses the generic role when none is supplied",
            async () => {
                const { run, service } = makeService()

                await service.process(context({
                    targetRole: " " 
                }))

                expect(String(run.mock.calls[0][0].messages[0].content)).toContain("mid Software Engineer")
            })

        it("degrades RAG failure without skipping the AI invocation",
            async () => {
                const { run, retrieveCvContext, service } = makeService()
                retrieveCvContext.mockRejectedValueOnce(new Error("rag unavailable"))

                await service.process(context())

                expect(run).toHaveBeenCalledTimes(1)
            })

        it("fails before AI invocation when the gather result is missing",
            async () => {
                const { jobAction, run, service } = makeService()
                jobAction.loadExecutionResult.mockResolvedValueOnce(null)

                await expect(service.process(context())).rejects.toThrow(
                    "Missing an upstream execution result for this CV generation step.",
                )
                expect(run).not.toHaveBeenCalled()
                expect(jobAction.failJob).toHaveBeenCalled()
            })
    })
