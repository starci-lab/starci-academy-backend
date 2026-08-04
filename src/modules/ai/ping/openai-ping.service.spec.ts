import OpenAI from "openai"
import {
    OpenAiPingService,
} from "./openai-ping.service"

jest.mock("openai")

const MockedOpenAI = OpenAI as unknown as jest.Mock

/** Build a service whose constructor deps are inert stubs. */
const buildService = (): OpenAiPingService => {
    return new OpenAiPingService(
        {
        } as never, // MountFilesystemService
        {
        } as never, // EventEmitterService
        {
        } as never, // WinstonService
        {
        } as never, // AiPingCacheService
    )
}

/** Reach the protected executePing for direct unit coverage. */
const callExecutePing = (service: OpenAiPingService, key: string) => {
    return (
        service as unknown as {
            executePing: (key: string) => Promise<{
                success: boolean
                errorMessage: string | null
            }>
        }
    ).executePing(key)
}

describe("OpenAiPingService.executePing",
    () => {
        beforeEach(() => {
            MockedOpenAI.mockReset()
        })

        it("returns success when models.list yields data",
            async () => {
                const list = jest.fn(async () => ({
                    data: [
                        {
                            id: "gpt-4o",
                        },
                    ],
                }))
                MockedOpenAI.mockImplementation(() => ({
                    models: {
                        list,
                    },
                }))

                const result = await callExecutePing(buildService(),
                    "sk-openai")

                expect(result).toEqual({
                    success: true,
                    errorMessage: null,
                })
                expect(MockedOpenAI).toHaveBeenCalledWith({
                    apiKey: "sk-openai",
                })
            })

        it("returns success=false when the model list is empty",
            async () => {
                MockedOpenAI.mockImplementation(() => ({
                    models: {
                        list: jest.fn(async () => ({
                            data: [],
                        })),
                    },
                }))

                const result = await callExecutePing(buildService(),
                    "sk-openai")

                expect(result.success).toBe(false)
                expect(result.errorMessage).toBeNull()
            })

        it("returns a failure outcome with the provider detail on an auth error",
            async () => {
                // mimic an OpenAI auth error carrying a response body detail
                const authError = Object.assign(new Error("Request failed with status code 401"),
                    {
                        response: {
                            data: {
                                error: {
                                    message: "Incorrect API key provided",
                                },
                            },
                        },
                    })
                MockedOpenAI.mockImplementation(() => ({
                    models: {
                        list: jest.fn(async () => {
                            throw authError
                        }),
                    },
                }))

                const result = await callExecutePing(buildService(),
                    "sk-bad")

                expect(result.success).toBe(false)
                // toPingErrorMessage surfaces the response-body detail
                expect(result.errorMessage).toContain("Incorrect API key provided")
            })
    })
