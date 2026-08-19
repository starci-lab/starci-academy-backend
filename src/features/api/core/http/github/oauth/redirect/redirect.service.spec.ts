import {
    GithubOauthRedirectCommandService 
} from "./redirect.service"

describe("GithubOauthRedirectCommandService",
    () => {
        it("dispatches the typed redirect command and returns its result",
            async () => {
                const commandBus = {
                    execute: jest.fn().mockResolvedValue({
                        url: "https://github.test/oauth" 
                    }) 
                }
                const service = new GithubOauthRedirectCommandService(commandBus as never)
                const params = {
                    refreshToken: "refresh-token",
                    redirectUri: "https://app.test/callback" 
                }
                await expect(service.execute(params)).resolves.toEqual({
                    url: "https://github.test/oauth" 
                })
                expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                    params 
                }))
            })
    })
