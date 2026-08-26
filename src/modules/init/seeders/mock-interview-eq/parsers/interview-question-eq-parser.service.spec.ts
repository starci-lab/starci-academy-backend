import {
    InterviewQuestionEqParserService,
} from "./interview-question-eq-parser.service"

describe("InterviewQuestionEqParserService",
    () => {
        const dependencies = () => ({
            path: {
                bankPaths: jest.fn().mockResolvedValue([{
                    relativePath: "1-bank",
                    orderIndex: 1,
                    displayId: "bank",
                }]),
                questionPaths: jest.fn().mockResolvedValue([{
                    relativePath: "1-bank/questions/1-q",
                    orderIndex: 1,
                    displayId: "q",
                }]),
            },
            loader: {
                load: jest.fn().mockResolvedValue("markdown"),
            },
            extract: {
                extract: jest.fn()
                    .mockReturnValueOnce({
                        title: "Bank"
                    })
                    .mockReturnValueOnce({
                        question: "Tell me about a failure",
                        competency: "Ownership",
                        ownershipSignal: "Names a lesson",
                    }),
            },
            scalar: {
                toNullableStringColumn: jest.fn((value: unknown) => value ?? null),
            },
            fields: {
                parseCommonFields: jest.fn().mockReturnValue({
                    title: "Tell me about a failure",
                }),
            },
            ids: {
                generate: jest.fn().mockReturnValue("question-id"),
            },
            winston: {
                log: jest.fn(),
            },
        })

        it("parses a global question with null course and module ownership",
            async () => {
                const d = dependencies()
                const service = new InterviewQuestionEqParserService(
                    d.path as never,
                    d.loader as never,
                    d.extract as never,
                    d.scalar as never,
                    d.fields as never,
                    d.ids as never,
                    d.winston as never,
                )

                await expect(service.parseMany()).resolves.toEqual([expect.objectContaining({
                    id: "question-id",
                    courseId: null,
                    moduleId: null,
                    bankSlug: "bank",
                    displayId: "q",
                    competency: "Ownership",
                    ownershipSignal: "Names a lesson",
                    langs: [],
                    diagram: null,
                })])
                expect(d.ids.generate).toHaveBeenCalledWith({
                    bankIndex: 1,
                    questionIndex: 1,
                })
            })

        it("skips a bank whose metadata cannot be loaded and logs the relative path",
            async () => {
                const d = dependencies()
                d.loader.load.mockRejectedValue(new Error("missing vi.md"))
                const service = new InterviewQuestionEqParserService(
                    d.path as never,
                    d.loader as never,
                    d.extract as never,
                    d.scalar as never,
                    d.fields as never,
                    d.ids as never,
                    d.winston as never,
                )

                await expect(service.parseMany()).resolves.toEqual([])
                expect(d.winston.log).toHaveBeenCalled()
            })
    })
