import OpenAI from "openai"
import {
    OpenRouterPingService,
} from "./openrouter-ping.service"

jest.mock("openai")
// NOTE: do NOT mock @modules/env wholesale -- its envConfig is consumed at
// module-load by @modules/cache (config.ts). The SUT only needs
// envConfig().ai.openrouter.baseUrl, which the real config already provides.

const MockedOpenAI = OpenAI as unknown as jest.Mock

/** Build a service whose constructor deps are inert stubs. */
const buildService = (): OpenRouterPingService => {
    return new OpenRouterPingService(
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
const callExecutePing = (service: OpenRouterPingService, key: string) => {
    return (
        service as unknown as {
            executePing: (key: string) => Promise<{
                success: boolean
                errorMessage: string | null
            }>
        }
    ).executePing(key)
}

describe("OpenRouterPingService.executePing",
    () => {
        beforeEach(() => {
            MockedOpenAI.mockReset()
        })

        it("returns success when models.list yields data (via OpenRouter baseURL)",
            async () => {
                MockedOpenAI.mockImplementation(() => ({
                    models: {
                        list: jest.fn(async () => ({
                            data: [
                                {
                                    id: "anthropic/claude",
                                },
                            ],
                        })),
                    },
                }))

                const result = await callExecutePing(buildService(),
                    "sk-or")

                expect(result).toEqual({
                    success: true,
                    errorMessage: null,
                })
                // client is built with the key + the configured OpenRouter baseURL
                expect(MockedOpenAI).toHaveBeenCalledWith(
                    expect.objectContaining({
                        apiKey: "sk-or",
                        baseURL: expect.any(String),
                    }),
                )
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
                    "sk-or")

                expect(result.success).toBe(false)
                expect(result.errorMessage).toBeNull()
            })

        it("returns a failure outcome on a network error",
            async () => {
                const networkError = new Error("connect ECONNREFUSED 1.2.3.4:443")
                MockedOpenAI.mockImplementation(() => ({
                    models: {
                        list: jest.fn(async () => {
                            throw networkError
                        }),
                    },
                }))

                const result = await callExecutePing(buildService(),
                    "sk-or")

                expect(result.success).toBe(false)
                expect(result.errorMessage).toContain("ECONNREFUSED")
            })
    })
