import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    RewardsResolver,
} from "./rewards.resolver"

describe("RewardsResolver",
    () => {
        it("returns the localized catalog from RewardsService",
            async () => {
                const catalog = [{
                    key: "streak_freeze", title: "Freeze"
                }]
                const getCatalog = jest.fn().mockReturnValue(catalog)
                const resolver = new RewardsResolver({
                    getCatalog
                } as never)

                await expect(resolver.execute(Locale.En)).resolves.toBe(catalog)
                expect(getCatalog).toHaveBeenCalledWith(Locale.En)
            })

        it("preserves catalog lookup failures for the GraphQL boundary",
            async () => {
                const failure = new Error("catalog unavailable")
                const getCatalog = jest.fn().mockImplementation(() => {
                    throw failure
                })
                const resolver = new RewardsResolver({
                    getCatalog
                } as never)

                await expect(resolver.execute(Locale.Vi)).rejects.toBe(failure)
                expect(getCatalog).toHaveBeenCalledWith(Locale.Vi)
            })
    })
