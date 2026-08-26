import {
    buildShortSnippet,
    searchByTitleAndDescription,
} from "./simple-title-description-search"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

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
        it("centers an unhighlighted snippet and normalizes whitespace",
            () => {
                expect(buildShortSnippet("  one\n two   three  ",
                    1)).toBe("... one two three ...")
            })
    })

describe("searchByTitleAndDescription",
    () => {
        it("builds the locale index query and maps highlighted and fallback hits",
            async () => {
                const search = jest.fn().mockResolvedValue({
                    hits: {
                        hits: [
                            {
                                _id: "fallback-id",
                                _source: {
                                    displayId: "display-1",
                                    title: "Source title",
                                },
                                highlight: {
                                    title: ["<em>source</em> title"],
                                    description: ["a description"],
                                },
                            },
                            {
                                _id: "second-id",
                                _source: undefined,
                                highlight: undefined,
                            },
                        ],
                    },
                })
                const elasticsearch = {
                    indicateName: jest.fn().mockReturnValue("courses-en"),
                    client: {
                        search,
                    },
                }

                await expect(searchByTitleAndDescription(elasticsearch as never,
                    "CourseEntity",
                    {
                        term: "source",
                        size: 10,
                        locale: Locale.En,
                    })).resolves.toEqual([
                    {
                        id: "fallback-id",
                        displayId: "display-1",
                        title: "Source title",
                        texts: ["... <em>source</em> title ...",
                            "... a description ..."],
                    },
                    {
                        id: "second-id",
                        displayId: "",
                        title: "",
                        texts: ["..."],
                    },
                ])
                expect(elasticsearch.indicateName).toHaveBeenCalledWith({
                    entity: "CourseEntity",
                    locale: "en",
                })
                expect(search).toHaveBeenCalledWith(expect.objectContaining({
                    index: "courses-en",
                    size: 10,
                    _source: ["id",
                        "displayId",
                        "title",
                        "description"],
                }))
            })
        it("returns an empty result without manufacturing items",
            async () => {
                const elasticsearch = {
                    indicateName: jest.fn().mockReturnValue("index"),
                    client: {
                        search: jest.fn().mockResolvedValue({
                            hits: {
                                hits: [],
                            },
                        }),
                    },
                }
                await expect(searchByTitleAndDescription(elasticsearch as never,
                    "Entity",
                    {
                        term: "none",
                        size: 5,
                        locale: Locale.Vi,
                    })).resolves.toEqual([])
            })
    })
