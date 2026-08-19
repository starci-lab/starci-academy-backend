import {
    OAuthStateService 
} from "./oauth-state.service"

describe("OAuthStateService",
    () => {
        it("issues a purpose-scoped state and atomically consumes it once",
            async () => {
                const redis = {
                    set: jest.fn().mockResolvedValue("OK"),
                    eval: jest.fn().mockResolvedValue(JSON.stringify({
                        userId: "u1" 
                    })),
                }
                const service = new OAuthStateService(redis as never)
                const state = await service.issue({
                    purpose: "github", payload: {
                        userId: "u1" 
                    } 
                })
                expect(state).toEqual(expect.any(String))
                expect(redis.set).toHaveBeenCalledWith(expect.stringMatching(/^oauth-state:github:/),
                    JSON.stringify({
                        userId: "u1" 
                    }),
                    "PX",
                    expect.any(Number))
                await expect(service.consume<{ userId: string }>({
                    purpose: "github", state 
                })).resolves.toEqual({
                    userId: "u1" 
                })
                expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining("DEL"),
                    1,
                    expect.stringMatching(/^oauth-state:github:/))
            })

        it("returns undefined for a missing or already-consumed state",
            async () => {
                const redis = {
                    eval: jest.fn().mockResolvedValue(null) 
                }
                const service = new OAuthStateService(redis as never)
                await expect(service.consume({
                    purpose: "github", state: "replayed" 
                })).resolves.toBeUndefined()
            })
    })
