import {
    parseScopeIndexes 
} from "./parse-scope-indexes"

describe("parseScopeIndexes",
    () => {
        it.each([["all",
            null],
        ["1-3,7",
            new Set([1,
                2,
                3,
                7])],
        [[1,
            1,
            4],
        new Set([1,
            4])],
        [3,
            new Set([3])]])("parses %p",
            (input, expected) => expect(parseScopeIndexes(input as never)).toEqual(expected))
        it("safely ignores malformed and reversed ranges",
            () => expect(parseScopeIndexes("3-1,wat,,2" as never)).toEqual(new Set([2])))
    })
