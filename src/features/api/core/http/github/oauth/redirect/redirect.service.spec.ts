import {
    GithubOauthRedirectCommandService 
} from "./redirect.service"

describe("GithubOauthRedirectCommandService",
    () => {
        it("dispatches the typed redirect command and returns its result",
            async () => {
                const commandBus = {
                    execute: jest.fn().mockResolvedValue({
                        authorizationUrl: "https://github.test/oauth" 
                    }) 
                }
                const service = new GithubOauthRedirectCommandService(commandBus as never)
                const params = {
                    redirectUri: "https://app.test/callback" 
                }
                await expect(service.execute(params)).resolves.toEqual({
                    authorizationUrl: "https://github.test/oauth" 
                })
                expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                    params 
                }))
            })
    })
