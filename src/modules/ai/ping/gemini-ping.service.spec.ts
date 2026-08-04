import {
    GeminiPingService,
} from "./gemini-ping.service"

/** Stub axios instance returned by AxiosService.create. */
const buildService = (axiosGet: jest.Mock): GeminiPingService => {
    const axiosService = {
        create: jest.fn(() => ({
            get: axiosGet,
        })),
    }
    return new GeminiPingService(
        axiosService as never, // AxiosService
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
const callExecutePing = (service: GeminiPingService, key: string) => {
    return (
        service as unknown as {
            executePing: (key: string) => Promise<{
                success: boolean
                errorMessage: string | null
            }>
        }
    ).executePing(key)
}

describe("GeminiPingService.executePing",
    () => {
        it("returns success on a 2xx list-models response",
            async () => {
                const get = jest.fn(async () => ({
                    status: 200,
                }))

                const result = await callExecutePing(buildService(get),
                    "sk-gemini")

                expect(result).toEqual({
                    success: true,
                    errorMessage: null,
                })
                // key is carried in the query string of the request URL
                expect(get).toHaveBeenCalledWith(
                    expect.stringContaining("key=sk-gemini"),
                )
            })

        it("returns success=false on a non-2xx status",
            async () => {
                const get = jest.fn(async () => ({
                    status: 403,
                }))

                const result = await callExecutePing(buildService(get),
                    "sk-gemini")

                expect(result.success).toBe(false)
                expect(result.errorMessage).toBeNull()
            })

        it("returns a failure outcome with provider detail on an auth error",
            async () => {
                // axios-style error carrying Google's { error: { message } } body
                const authError = Object.assign(new Error("Request failed with status code 400"),
                    {
                        response: {
                            data: {
                                error: {
                                    message: "API key not valid. Please pass a valid API key.",
                                },
                            },
                        },
                    })
                const get = jest.fn(async () => {
                    throw authError
                })

                const result = await callExecutePing(buildService(get),
                    "sk-bad")

                expect(result.success).toBe(false)
                expect(result.errorMessage).toContain("API key not valid")
            })
    })
