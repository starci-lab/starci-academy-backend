import {
    GlobalSearchEntityUtilsService
} from "./utils.service"

describe("GlobalSearchEntityUtilsService",
    () => {
        const service = new GlobalSearchEntityUtilsService()

        it("cleans markdown and highlight markers",
            () => {
                expect(service.cleanDisplayText("**hello** `world`\\!")).toBe("hello world!")
            })

        it("builds centered snippets and handles empty text",
            () => {
                expect(service.buildShortSnippet("")).toBe("...")
                expect(service.buildShortSnippet("one two <em>focus</em> four five six")).toContain("<em>focus</em>")
            })
    })
