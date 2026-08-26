import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyCvGenerationsResolver,
} from "./my-cv-generations.resolver"

describe("MyCvGenerationsResolver",
    () => {
        it("passes the authenticated user, locale, and request to the service",
            async () => {
                const execute = jest.fn().mockResolvedValue([{
                    id: "cv-1"
                }])
                const request = {
                    limit: 5,
                    offset: 1,
                }
                const user = {
                    id: "user-1",
                }

                await expect(new MyCvGenerationsResolver({
                    execute,
                } as never).execute(user as never,
                    Locale.Vi,
                    request as never)).resolves.toEqual([{
                    id: "cv-1"
                }])
                expect(execute).toHaveBeenCalledWith({
                    request,
                    locale: Locale.Vi,
                    user,
                })
            })

        it("supplies an empty request when GraphQL omits it",
            async () => {
                const execute = jest.fn().mockResolvedValue([])
                const user = {
                    id: "user-2",
                }
                await new MyCvGenerationsResolver({
                    execute,
                } as never).execute(user as never,
                    Locale.En)

                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    request: {
                    },
                    locale: Locale.En,
                }))
            })
    })
