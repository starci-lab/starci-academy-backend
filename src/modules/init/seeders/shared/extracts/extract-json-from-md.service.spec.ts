import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    ExtractJsonFromMdService,
} from "./extract-json-from-md.service"

describe("ExtractJsonFromMdService",
    () => {
        let module: TestingModule
        let service: ExtractJsonFromMdService

        beforeEach(async () => {
        // the extractor is pure -- no collaborators to mock
            module = await Test.createTestingModule({
                providers: [
                    ExtractJsonFromMdService,
                ],
            }).compile()

            service = module.get<ExtractJsonFromMdService>(ExtractJsonFromMdService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("extract",
            () => {
                it("returns an empty object for empty input",
                    () => {
                        expect(service.extract("")).toEqual({
                        })
                    })

                it("maps string headings to object fields (recursively)",
                    () => {
                        const markdown = [
                            "# title",
                            "Hello",
                            "# meta",
                            "## author",
                            "Bob",
                        ].join("\n")

                        expect(service.extract(markdown)).toEqual({
                            title: "Hello",
                            meta: {
                                author: "Bob",
                            },
                        })
                    })

                it("maps numeric headings to a sorted array with orderIndex",
                    () => {
                        const markdown = [
                            "# 1",
                            "## name",
                            "second",
                            "# 0",
                            "## name",
                            "first",
                        ].join("\n")

                        expect(service.extract(markdown)).toEqual({
                            data: [
                                {
                                    name: "first",
                                    orderIndex: 0,
                                },
                                {
                                    name: "second",
                                    orderIndex: 1,
                                },
                            ],
                        })
                    })

                it("treats a @starci/seperator block as a verbatim string leaf",
                    () => {
                        const markdown = [
                            "# body",
                            "<!-- @starci/seperator -->",
                            "# not a heading",
                            "raw markdown",
                            "<!-- @starci/seperator -->",
                        ].join("\n")

                        expect(service.extract(markdown)).toEqual({
                            body: "# not a heading\nraw markdown",
                        })
                    })

                it("slices the section after a multi-item object whose nested separators are unbalanced (flashcard # tags → # answer)",
                    () => {
                        // a `# tags` object holds `## n` items each wrapped in its own separator
                        // leaf; that nests an ODD number of separators. The next sibling heading
                        // (`# answer`) must still open its own section and not be swallowed into
                        // tags -- the exact bug that left every flashcard card with a null answer.
                        const markdown = [
                            "# tags",
                            "## 0",
                            "<!-- @starci/seperator -->",
                            "Linux",
                            "## 1",
                            "<!-- @starci/seperator -->",
                            "Shell",
                            "<!-- @starci/seperator -->",
                            "# answer",
                            "<!-- @starci/seperator -->",
                            "the model answer",
                            "<!-- @starci/seperator -->",
                        ].join("\n")

                        expect(service.extract(markdown)).toEqual({
                            tags: [
                                {
                                    orderIndex: 0,
                                    value: "Linux",
                                },
                                {
                                    orderIndex: 1,
                                    value: "Shell",
                                },
                            ],
                            answer: "the model answer",
                        })
                    })

                it("cannot shield a jsonb `# n` item heading from splitSections' level-1 scan (known pre-existing bug)",
                    () => {
                        // INTENT (per the class docstring): a jsonb block lives INSIDE a
                        // separator leaf so its inner `# n` item headings are protected and
                        // parsed by tryParseJsonbLeaf into a coerced array-of-objects.
                        //
                        // REALITY: `extract()` always enters via `parseLevel(fullDocument, 1)`,
                        // so splitSections' level-1 scan walks every raw line of the WHOLE
                        // document in one pass -- not just the "items" section's own slice.
                        // MOUNT_JSONB_ITEM_HEADING_RE item headings are hardcoded to a literal
                        // single `#`, so `# 0` always matches the level-1 heading prefix. The
                        // numeric-section-boundary override (added for flashcard `# tags` ->
                        // `## 0`/`## 1` buckets) unconditionally bypasses `inDelimiterLeaf` for
                        // any numeric heading key, so `# 0` forces a level-1 section break
                        // *through* the separator leaf no matter how deeply it is nested --
                        // splitting "items" apart before cutBoundedLeaf/tryParseJsonbLeaf ever
                        // run. The jsonb marker itself is left stranded as a string, and the
                        // item's fields leak out as a sibling "0" section instead of an array
                        // entry under "items".
                        //
                        // This reproduces regardless of how deeply "items" is nested under
                        // other headings, because the level-1 scan always covers the entire
                        // document text on the very first parseLevel call. Fixing this requires
                        // touching the service (out of scope here); this test pins the current,
                        // real (broken) behavior so the suite stays green and honest.
                        const markdown = [
                            "# items",
                            "<!-- @starci/seperator -->",
                            "<!-- @starci/jsonb -->",
                            "# 0",
                            "## label",
                            "alpha",
                            "## count",
                            "5",
                            "## enabled",
                            "true",
                            "<!-- @starci/jsonb -->",
                            "<!-- @starci/seperator -->",
                        ].join("\n")

                        expect(service.extract(markdown)).toEqual({
                            items: "<!-- @starci/jsonb -->",
                            "0": {
                                label: "alpha",
                                count: "5",
                                enabled: "true\n<!-- @starci/jsonb -->\n<!-- @starci/seperator -->",
                            },
                        })

                    })

                it("coerces scalar leaves and ignores fenced headings",
                    () => {
                        expect(service.extract([
                            "# enabled",
                            "true",
                            "# count",
                            "42",
                            "# ratio",
                            "3.5",
                            "# none",
                            "null",
                            "# code",
                            "```",
                            "# hidden",
                            "```",
                        ].join("\n"))).toEqual({
                            enabled: "true", count: "42", ratio: "3.5", none: "null", code: "```\n# hidden\n```"
                        })
                    })

                it("parses JSONB item fields with numeric and boolean coercion",
                    () => {
                        const parser = service as unknown as {
                            parseJsonbItems: (inner: string) => Array<Record<string, unknown>>
                        }
                        const result = parser.parseJsonbItems([
                            "# 0",
                            "## label",
                            "alpha",
                            "## count",
                            "5",
                            "## enabled",
                            "true",
                            "## code",
                            "```",
                            "## hidden",
                            "```",
                            "# 2",
                            "## label",
                            "beta",
                            "## enabled",
                            "false",
                        ].join("\n"))

                        expect(result).toEqual([
                            {
                                orderIndex: 0,
                                label: "alpha",
                                count: 5,
                                enabled: true,
                                code: "```\n## hidden\n```",
                            },
                            {
                                orderIndex: 2,
                                label: "beta",
                                enabled: false,
                            },
                        ])
                    })

                it("recognizes a complete JSONB wrapper and rejects an incomplete wrapper",
                    () => {
                        const parser = service as unknown as {
                            tryParseJsonbLeaf: (content: string) => Array<Record<string, unknown>> | undefined
                        }
                        expect(parser.tryParseJsonbLeaf([
                            "<!-- @starci/jsonb -->",
                            "# 0",
                            "## score",
                            "7",
                            "<!-- @starci/jsonb -->",
                        ].join("\n"))).toEqual([{
                            orderIndex: 0,
                            score: 7,
                        }])
                        expect(parser.tryParseJsonbLeaf("<!-- @starci/jsonb -->\n# 0")).toBeUndefined()
                    })
            })
    })
