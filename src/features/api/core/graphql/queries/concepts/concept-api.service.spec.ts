import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import {
    ConceptApiService,
} from "./concept-api.service"

describe("ConceptApiService",
    () => {
        const entity = (): ConceptEntity => ({
            id: "concept-1",
            displayId: "request-lifecycle",
            title: "Request lifecycle",
            description: "English description",
            category: "backend",
            difficulty: "foundation",
            minutesRead: 65,
            implementation: "typescript",
            orderIndex: 0,
            sortIndex: 0,
            body: "English body",
            learningOutcomes: [{
                id: "outcome-1",
                text: "Trace the lifecycle",
            }],
            prerequisites: [],
            references: [],
            workspace: {
                runtime: "Node.js 24",
                files: [
                    {
                        path: "workspace/source.ts",
                        role: "source",
                    },
                    {
                        path: "workspace/source.test.ts",
                        role: "test",
                    },
                    {
                        path: "private/check.ts",
                        role: "checks" as never,
                    },
                ],
                commands: {
                    unix: "node --test workspace/source.test.ts",
                },
            },
            activities: [{
                id: "retrieval-1",
                kind: "retrieval",
                stableKey: "retrieval-1",
                prompt: "Explain the failure.",
                responseKind: "written-explanation",
                evaluationMethod: "ai-rubric",
                feedbackRelease: "after-submit",
                outcomeIds: ["outcome-1"],
                afterDays: 1,
                answer: {
                    explanation: "Private model answer",
                },
                rubric: [{
                    id: "criterion-1",
                    criterion: "Correct mechanism",
                    expectedEvidence: "Private expected evidence",
                    maxScore: 2,
                }],
            }],
            translations: [{
                conceptId: "concept-1",
                locale: Locale.Vi,
                title: "Vong doi request",
                description: "Mo ta tieng Viet",
                body: "Noi dung tieng Viet",
                learningOutcomes: [{
                    id: "outcome-1",
                    text: "Theo doi lifecycle",
                }],
                prerequisites: [],
                references: [],
                activities: [{
                    id: "choice-1",
                    kind: "choice",
                    prompt: "Chon trace",
                    options: [{
                        id: "a",
                        label: "Trace A",
                        explanation: "Private option feedback",
                        isCorrect: true,
                    }],
                    answer: {
                        explanation: "Private translated answer",
                    },
                }],
            } as never],
            sections: [{
                id: "section-1",
                displayId: "predict",
                title: "Predict",
                phase: "predict",
                body: "English section",
                orderIndex: 0,
                sortIndex: 0,
                activities: [{
                    id: "exercise-1",
                    kind: "exercise",
                    prompt: "Implement it.",
                    exercise: {
                        submissionInstructions: "Edit source.ts",
                        verificationMode: "command",
                        verificationInstructions: "Run the public test",
                        checks: [{
                            runner: "node",
                            entrypoint: "private-check.ts",
                            expectedExitCode: 0,
                        }],
                    },
                }],
                translations: [],
            } as never],
        } as unknown as ConceptEntity)

        it("returns localized catalog cards in repository order",
            async () => {
                const find = jest.fn(async () => [entity()])
                const service = new ConceptApiService({
                    find,
                } as never,
                {
                    read: jest.fn(),
                } as never)

                await expect(service.list({
                    category: "backend",
                },
                Locale.Vi)).resolves.toEqual([expect.objectContaining({
                    displayId: "request-lifecycle",
                    title: "Vong doi request",
                })])
                expect(find).toHaveBeenCalledWith(expect.any(Function),
                    expect.objectContaining({
                        where: {
                            category: "backend",
                        },
                        order: {
                            sortIndex: "ASC",
                            orderIndex: "ASC",
                        },
                    }))
            })

        it("projects localized detail without answer keys, rubrics, or private checks",
            async () => {
                const sourceRead = jest.fn(async (_concept, file) => `content:${file.path}`)
                const service = new ConceptApiService({
                    findOne: jest.fn(async () => entity()),
                } as never,
                {
                    read: sourceRead,
                } as never)

                const result = await service.detail({
                    displayId: "request-lifecycle",
                },
                Locale.Vi)
                expect(result).toEqual(expect.objectContaining({
                    title: "Vong doi request",
                    body: "Noi dung tieng Viet",
                    capabilities: {
                        choiceSubmission: false,
                        writtenResponseGrading: false,
                        simulationExecution: false,
                    },
                }))
                expect(result?.activities[0]).toEqual({
                    id: "choice-1",
                    kind: "choice",
                    stableKey: null,
                    prompt: "Chon trace",
                    responseKind: null,
                    isDiagnostic: null,
                    outcomeIds: [],
                    afterDays: null,
                    options: [{
                        id: "a",
                        label: "Trace A",
                    }],
                    exercise: null,
                })
                expect(result?.sections[0].activities[0].exercise).toEqual({
                    submissionInstructions: "Edit source.ts",
                    verificationMode: "command",
                    verificationInstructions: "Run the public test",
                })
                expect(result?.workspace?.files).toEqual([
                    {
                        path: "workspace/source.ts",
                        role: "source",
                        content: "content:workspace/source.ts",
                    },
                    {
                        path: "workspace/source.test.ts",
                        role: "test",
                        content: "content:workspace/source.test.ts",
                    },
                ])
                const serialized = JSON.stringify(result)
                expect(serialized).not.toContain("Private")
                expect(serialized).not.toContain("isCorrect")
                expect(serialized).not.toContain("expectedEvidence")
                expect(serialized).not.toContain("private-check.ts")
            })

        it("returns null when no concept matches the route slug",
            async () => {
                const service = new ConceptApiService({
                    findOne: jest.fn(async () => null),
                } as never,
                {
                    read: jest.fn(),
                } as never)
                await expect(service.detail({
                    displayId: "missing",
                },
                Locale.En)).resolves.toBeNull()
            })

        it("never queries TypeORM with an empty displayId",
            async () => {
                const findOne = jest.fn()
                const service = new ConceptApiService({
                    findOne,
                } as never,
                {
                    read: jest.fn(),
                } as never)
                await expect(service.detail({
                    displayId: "",
                },
                Locale.En)).resolves.toBeNull()
                expect(findOne).not.toHaveBeenCalled()
            })
    })
