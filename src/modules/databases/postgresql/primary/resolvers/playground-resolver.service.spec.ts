import {
    Locale
} from "../enums/locale"
import {
    PlaygroundResolverService
} from "./playground-resolver.service"

describe("PlaygroundResolverService",
    () => {
        it("uses translated values and recursively transforms steps",
            () => {
                const resolve = jest.fn()
                    .mockReturnValueOnce("Localized title")
                    .mockReturnValueOnce("Localized description")
                    .mockReturnValueOnce("Step title")
                    .mockReturnValueOnce("Step body")
                const service = new PlaygroundResolverService({
                    resolve
                } as never)
                const playground = {
                    title: "base title", description: "base description", translations: [],
                    steps: [{
                        title: "base step", body: "base body", translations: []
                    }],
                }
                service.transform(playground as never,
                    Locale.Vi,
                    Locale.En)
                expect(playground.title).toBe("Localized title")
                expect(playground.steps[0].body).toBe("Step body")
                expect(playground).not.toHaveProperty("translations")
            })

        it("falls back to base title and handles playgrounds without steps",
            () => {
                const resolve = jest.fn().mockReturnValue("")
                const service = new PlaygroundResolverService({
                    resolve
                } as never)
                const playground = {
                    title: "base", description: "description", translations: []
                }
                service.transform(playground as never,
                    Locale.En,
                    Locale.En)
                expect(playground.title).toBe("base")
                expect(service.resolveTitle(playground as never,
                    Locale.En,
                    Locale.En)).toBe("base")
            })
    })
