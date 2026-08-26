import {
    ConnectGithubAccountService
} from "./connect-github-account.service"

describe("ConnectGithubAccountService",
    () => {
        it("delegates the user and GitHub input to the command bus",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    id: "u-1"
                })
                const user = {
                    id: "u-1"
                }
                const input = {
                    code: "github-code"
                }
                await expect(new ConnectGithubAccountService({
                    execute
                } as never).execute(user as never,
input as never)).resolves.toEqual({
                    id: "u-1"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params: {
                        user, input
                    }
                }))
            })
    })
