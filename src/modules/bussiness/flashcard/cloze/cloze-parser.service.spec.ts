import {
    ClozeParserService,
} from "./cloze-parser.service"

describe("ClozeParserService",
    () => {
        const parser = new ClozeParserService()

        it.each([
            ["{{c1::answer}}",
                1,
                "answer",
                undefined],
            ["{{c2::answer::hint}}",
                1,
                "answer",
                "hint"],
            ["{{c1::Ａ}}",
                1,
                "A",
                undefined],
            ["{{c1::key:value}}",
                1,
                "key:value",
                undefined],
            ["{{c1::one}} + {{c1::two}}",
                2,
                "one",
                undefined],
        ])("parses canonical vector %s",
            (source, count, answer, hint) => {
                const result = parser.parse("card",
                    source)
                expect(result.blanks).toHaveLength(count)
                expect(result.blanks[0]).toMatchObject({
                    answer
                })
                expect(result.blanks[0].hint).toBe(hint)
            })

        it.each([
            "{{c0::answer}}",
            "{{c1::}}",
            "{{c-1::answer}}",
            "{{c1:answer}}",
            "plain text",
        ])("keeps malformed vector literal: %s",
            (source) => {
                expect(parser.parse("card",
                    source)).toEqual({
                    text: source,
                    blanks: [],
                })
            })

        it("assigns a stable unique id to every repeated occurrence",
            () => {
                const result = parser.parse("card",
                    "{{c1::x}} {{c1::x}}")
                expect(result.blanks.map(({ blankId }) => blankId)).toEqual([
                    "card:c1:o1",
                    "card:c1:o2",
                ])
            })
    })
