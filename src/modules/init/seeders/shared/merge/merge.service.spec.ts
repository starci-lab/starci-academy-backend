import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    Locale,
} from "@modules/databases"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import {
    MergeJsonService,
} from "./merge.service"

describe("MergeJsonService",
    () => {
        let module: TestingModule
        let service: MergeJsonService

        beforeEach(async () => {
            module = await Test.createTestingModule({
                providers: [
                    MergeJsonService,
                ],
            }).compile()

            service = module.get<MergeJsonService>(MergeJsonService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("merge",
            () => {
                it("throws when jsons is empty",
                    () => {
                        expect(() => service.merge({
                            jsons: [],
                            translateFields: [
                                "title",
                            ],
                        })).toThrow(MissingRequiredParameterException)
                    })

                it("uses English as the canonical object and adds translations rows",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        title: "Hello",
                                        description: "English body",
                                        score: 10,
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        title: "Xin chao",
                                        description: "Noi dung tieng Viet",
                                        score: 10,
                                    },
                                },
                            ],
                            translateFields: [
                                "title",
                                "description",
                            ],
                        })

                        expect(merged.title).toBe("Hello")
                        expect(merged.description).toBe("English body")
                        expect(merged.score).toBe(10)
                        expect(merged.translations).toEqual([
                            {
                                locale: Locale.En,
                                field: "title",
                                value: "Hello",
                            },
                            {
                                locale: Locale.En,
                                field: "description",
                                value: "English body",
                            },
                            {
                                locale: Locale.Vi,
                                field: "title",
                                value: "Xin chao",
                            },
                            {
                                locale: Locale.Vi,
                                field: "description",
                                value: "Noi dung tieng Viet",
                            },
                        ])
                    })

                it("supports nested translateFields via dot-paths",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        meta: {
                                            author: "Alice",
                                        },
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        meta: {
                                            author: "An",
                                        },
                                    },
                                },
                            ],
                            translateFields: [
                                "meta.author",
                            ],
                        })

                        expect(merged.meta).toEqual({
                            author: "Alice",
                        })
                        expect(merged.translations).toEqual([
                            {
                                locale: Locale.En,
                                field: "meta.author",
                                value: "Alice",
                            },
                            {
                                locale: Locale.Vi,
                                field: "meta.author",
                                value: "An",
                            },
                        ])
                    })

                it("skips translation rows when a locale omits the field",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        title: "Hello",
                                        description: "English body",
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        title: "Xin chao",
                                    },
                                },
                            ],
                            translateFields: [
                                "title",
                                "description",
                            ],
                        })

                        expect(merged.translations).toEqual([
                            {
                                locale: Locale.En,
                                field: "title",
                                value: "Hello",
                            },
                            {
                                locale: Locale.En,
                                field: "description",
                                value: "English body",
                            },
                            {
                                locale: Locale.Vi,
                                field: "title",
                                value: "Xin chao",
                            },
                        ])
                    })

                it("does not mutate locale inputs",
                    () => {
                        const enJson = {
                            title: "Hello",
                        }
                        const viJson = {
                            title: "Xin chao",
                        }

                        service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: enJson,
                                },
                                {
                                    locale: Locale.Vi,
                                    json: viJson,
                                },
                            ],
                            translateFields: [
                                "title",
                            ],
                        })

                        expect(enJson.title).toBe("Hello")
                        expect(viJson.title).toBe("Xin chao")
                    })

                it("attaches translations on each array item like course prerequisites",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        title: "Course",
                                        prerequisites: [
                                            {
                                                orderIndex: 0,
                                                text: "Know TypeScript",
                                            },
                                            {
                                                orderIndex: 1,
                                                text: "Know HTTP",
                                            },
                                        ],
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        title: "Khoa hoc",
                                        prerequisites: [
                                            {
                                                orderIndex: 0,
                                                text: "Biet TypeScript",
                                            },
                                            {
                                                orderIndex: 1,
                                                text: "Biet HTTP",
                                            },
                                        ],
                                    },
                                },
                            ],
                            translateFields: [
                                "title",
                                "prerequisites.text",
                            ],
                        })

                        expect(merged.title).toBe("Course")
                        expect(merged.translations).toEqual([
                            {
                                locale: Locale.En,
                                field: "title",
                                value: "Course",
                            },
                            {
                                locale: Locale.Vi,
                                field: "title",
                                value: "Khoa hoc",
                            },
                        ])
                        expect(merged.prerequisites).toEqual([
                            {
                                orderIndex: 0,
                                text: "Know TypeScript",
                                translations: [
                                    {
                                        locale: Locale.En,
                                        field: "text",
                                        value: "Know TypeScript",
                                    },
                                    {
                                        locale: Locale.Vi,
                                        field: "text",
                                        value: "Biet TypeScript",
                                    },
                                ],
                            },
                            {
                                orderIndex: 1,
                                text: "Know HTTP",
                                translations: [
                                    {
                                        locale: Locale.En,
                                        field: "text",
                                        value: "Know HTTP",
                                    },
                                    {
                                        locale: Locale.Vi,
                                        field: "text",
                                        value: "Biet HTTP",
                                    },
                                ],
                            },
                        ])
                    })

                it("supports multiple translatable fields on the same array item",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        qnas: [
                                            {
                                                orderIndex: 0,
                                                question: "Q?",
                                                answer: "A.",
                                            },
                                        ],
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        qnas: [
                                            {
                                                orderIndex: 0,
                                                question: "Hoi?",
                                                answer: "Dap.",
                                            },
                                        ],
                                    },
                                },
                            ],
                            translateFields: [
                                "qnas.question",
                                "qnas.answer",
                            ],
                        })

                        expect(merged.qnas?.[0]).toEqual({
                            orderIndex: 0,
                            question: "Q?",
                            answer: "A.",
                            translations: [
                                {
                                    locale: Locale.En,
                                    field: "question",
                                    value: "Q?",
                                },
                                {
                                    locale: Locale.En,
                                    field: "answer",
                                    value: "A.",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "question",
                                    value: "Hoi?",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "answer",
                                    value: "Dap.",
                                },
                            ],
                        })
                        expect(merged.translations).toEqual([])
                    })
            })
    })
