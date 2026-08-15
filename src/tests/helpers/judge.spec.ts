import OpenAI from "openai"
import {
    HARNESS_OPENROUTER_JUDGE_API_KEY,
} from "./harness-credentials"
import {
    judge,
} from "./judge"

jest.mock("openai")

const MockedOpenAI = OpenAI as unknown as jest.Mock

describe("judge",
    () => {
        const originalJudgeKey = process.env[HARNESS_OPENROUTER_JUDGE_API_KEY]
        const create = jest.fn()

        beforeEach(() => {
            process.env[HARNESS_OPENROUTER_JUDGE_API_KEY] = "judge-key"
            create.mockReset()
            MockedOpenAI.mockReset()
            MockedOpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create,
                    },
                },
            }))
        })

        afterAll(() => {
            if (originalJudgeKey === undefined) {
                delete process.env[HARNESS_OPENROUTER_JUDGE_API_KEY]
            } else {
                process.env[HARNESS_OPENROUTER_JUDGE_API_KEY] = originalJudgeKey
            }
        })

        it("calls the pinned Luna judge through OpenRouter and parses its verdict",
            async () => {
                create.mockResolvedValueOnce({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    pass: true,
                                    score: 91,
                                    reasons: [
                                        "grounded",
                                    ],
                                }),
                            },
                        },
                    ],
                })

                await expect(judge("Must be grounded",
                    "Grounded answer")).resolves.toEqual({
                    pass: true,
                    score: 91,
                    reasons: [
                        "grounded",
                    ],
                })
                expect(MockedOpenAI).toHaveBeenCalledWith({
                    apiKey: "judge-key",
                    baseURL: "https://openrouter.ai/api/v1",
                })
                expect(create).toHaveBeenCalledWith(expect.objectContaining({
                    model: "openai/gpt-5.6-luna",
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: "system",
                            content: expect.stringContaining("pass and score must agree"),
                        }),
                    ]),
                    response_format: expect.objectContaining({
                        type: "json_schema",
                    }),
                }))
            })

        it("fails visibly when the judge returns no content",
            async () => {
                create.mockResolvedValueOnce({
                    choices: [],
                })

                await expect(judge("rubric",
                    "output")).rejects.toThrow("OpenRouter judge returned no verdict")
            })

        it("rejects a verdict outside the frozen schema",
            async () => {
                create.mockResolvedValueOnce({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    pass: true,
                                    score: 101,
                                    reasons: [],
                                }),
                            },
                        },
                    ],
                })

                await expect(judge("rubric",
                    "output")).rejects.toThrow("OpenRouter judge returned an invalid verdict")
            })
    })
