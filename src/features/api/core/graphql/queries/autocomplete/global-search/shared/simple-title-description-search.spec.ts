import {
    buildShortSnippet
} from "./simple-title-description-search"

describe("buildShortSnippet",
    () => {
        it("handles empty text and preserves highlighted focus",
            () => {
                expect(buildShortSnippet("",
                    20)).toBe("...")
                expect(buildShortSnippet("one two <em>focus</em> three four",
                    20)).toContain("<em>focus</em>")
            })
        it("adds ellipses when text exceeds the requested window",
            () => {
                expect(buildShortSnippet("one two three four five six",
                    12)).toMatch(/^\.\.\./)
            })
    })
