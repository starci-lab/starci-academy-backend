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
        // the extractor is pure — no collaborators to mock
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

                it("parses a nested @starci/jsonb block into a coerced array-of-objects",
                    () => {
                        // a jsonb block lives INSIDE a separator leaf — that is what makes the
                        // section a bounded leaf so its inner `# n` headings are not sliced
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
                            items: [
                                {
                                    orderIndex: 0,
                                    label: "alpha",
                                    count: 5,
                                    enabled: true,
                                },
                            ],
                        })
                    })
            })
    })
