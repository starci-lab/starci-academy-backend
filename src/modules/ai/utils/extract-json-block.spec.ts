import {
    extractJsonBlock,
} from "./extract-json-block"

describe("extractJsonBlock",
    () => {
        it("returns a bare JSON object untouched",
            () => {
                // already valid JSON -- slicing must return the same object text
                expect(extractJsonBlock("{\"score\":10}")).toBe("{\"score\":10}")
            })

        it("unwraps a ```json fenced block",
            () => {
                // the model wrapped its answer in a fenced code block
                const raw = "```json\n{\"ok\":true}\n```"
                expect(extractJsonBlock(raw)).toBe("{\"ok\":true}")
            })

        it("unwraps a plain ``` fence with no language tag",
            () => {
                // a fence without the json hint must still be stripped
                const raw = "```\n[1,2,3]\n```"
                expect(extractJsonBlock(raw)).toBe("[1,2,3]")
            })

        it("slices away prose before and after the JSON object",
            () => {
                // the model added explanatory prose around the payload
                const raw = "Here is the result: {\"a\":1} — hope it helps!"
                expect(extractJsonBlock(raw)).toBe("{\"a\":1}")
            })

        it("matches the outermost object when objects are nested",
            () => {
                // bracket depth tracking must close on the outermost brace
                const raw = "{\"outer\":{\"inner\":1}}"
                expect(extractJsonBlock(raw)).toBe("{\"outer\":{\"inner\":1}}")
            })

        it("ignores brackets that appear inside string literals",
            () => {
                // a closing brace inside a string must not end the object early
                const raw = "{\"note\":\"a } here\"}"
                expect(extractJsonBlock(raw)).toBe("{\"note\":\"a } here\"}")
            })

        it("ignores an escaped quote inside a string literal",
            () => {
                // the escaped quote must not flip the in-string state
                const raw = "{\"note\":\"say \\\"hi\\\" }\"}"
                expect(extractJsonBlock(raw)).toBe("{\"note\":\"say \\\"hi\\\" }\"}")
            })

        it("selects an array when the first bracket is a square bracket",
            () => {
                // the first opening bracket is `[`, so the array close governs
                const raw = "prefix [\"x\",\"y\"] suffix"
                expect(extractJsonBlock(raw)).toBe("[\"x\",\"y\"]")
            })

        it("returns the text unchanged when there is no bracket at all",
            () => {
                // no JSON structure -> caller gets the trimmed text back verbatim
                expect(extractJsonBlock("  no json here  ")).toBe("no json here")
            })

        it("returns from the first bracket onward when brackets are unbalanced",
            () => {
                // depth never returns to zero -> best-effort slice from the first brace
                const raw = "{\"a\":1"
                expect(extractJsonBlock(raw)).toBe("{\"a\":1")
            })
    })
