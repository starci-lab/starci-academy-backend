import path from "path"
import fs from "fs"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MissingRequiredParameterException,
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
import {
    MergeJsonService,
} from "./merge.service"

/** Fixture extracts for `1-custom-provider-dynamic-module-medium` (M0 challenge). */
const CHALLENGE_MEDIUM_EN_JSON = path.join(
    __dirname,
    "__fixtures__",
    "challenge-medium.en.json",
)
const CHALLENGE_MEDIUM_VI_JSON = path.join(
    __dirname,
    "__fixtures__",
    "challenge-medium.vi.json",
)

/** Same `translateFields` + `langBucketSections` as {@link ChallengeParserService}. */
const translateFields = [
    "title",
    "description",
    "requirements.langs.title",
    "requirements.langs.body",
    "steps.langs.title",
    "steps.langs.body",
    "outputs.langs.body",
    "prerequisites.langs.body",
]

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

                it(
                    "merges custom-provider-medium challenge en.json + vi.json lang-bucket sections",
                    () => {
                        const enJson = JSON.parse(
                            fs.readFileSync(
                                CHALLENGE_MEDIUM_EN_JSON,
                                "utf8",
                            ),
                        ) as Record<string, unknown>
                        const viJson = JSON.parse(
                            fs.readFileSync(
                                CHALLENGE_MEDIUM_VI_JSON,
                                "utf8",
                            ),
                        ) as Record<string, unknown>

                        const merged = service.merge({
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
                            translateFields,
                        })

                        expect(merged.title).toBe(enJson.title)
                        expect(merged.description).toBe(enJson.description)
                        expect(merged.requirements).toHaveLength(3)
                        expect(merged.steps).toHaveLength(3)
                        expect(merged.outputs).toHaveLength(3)
                        expect(merged.prerequisites).toHaveLength(3)

                        const typescriptRequirements = (
                            merged.requirements as Array<Record<string, unknown>>
                        ).find((bucket) => bucket.lang === "typescript")
                        expect(typescriptRequirements?.langs).toHaveLength(2)

                        const requirementItem0 = (
                            typescriptRequirements?.langs as Array<Record<string, unknown>>
                        )[0]
                        expect(requirementItem0?.title).toBe(
                            "Define the Store interface + two implementations and a dynamic module forRoot(options)",
                        )
                        expect(requirementItem0?.score).toBe("50")
                        expect(requirementItem0?.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    locale: Locale.En,
                                    field: "title",
                                    value: "Define the Store interface + two implementations and a dynamic module forRoot(options)",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Định nghĩa interface Store + hai implementation và một dynamic module forRoot(options)", // vn-ok: vi-locale seed fixture assertion
                                },
                                {
                                    locale: Locale.En,
                                    field: "body",
                                    // walk through the Array<unknown> jsonb shape with explicit casts at every hop
                                    value: ((enJson.requirements as Array<Record<string, unknown>>)[0]
                                        .langs as Array<Record<string, unknown>>)[0].body,
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "body",
                                    value: ((viJson.requirements as Array<Record<string, unknown>>)[0]
                                        .langs as Array<Record<string, unknown>>)[0].body,
                                },
                            ]),
                        )

                        const typescriptSteps = (
                            merged.steps as Array<Record<string, unknown>>
                        ).find((bucket) => bucket.lang === "typescript")
                        const stepItem0 = (
                            typescriptSteps?.langs as Array<Record<string, unknown>>
                        )[0]
                        expect(stepItem0?.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    locale: Locale.En,
                                    field: "title",
                                    value: "Initialize the project and define the Store interface + two impls",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Khởi tạo project và định nghĩa interface Store + hai impl", // vn-ok: vi-locale seed fixture assertion
                                },
                            ]),
                        )

                        expect(merged.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    locale: Locale.En,
                                    field: "title",
                                    value: "Swap implementations via DI and configure at compose time",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Hoán đổi implementation qua DI và cấu hình lúc compose", // vn-ok: vi-locale seed fixture assertion
                                },
                            ]),
                        )
                    },
                )

                it("attaches translations on lang-bucket data items",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        requirements: [
                                            {
                                                lang: "typescript",
                                                orderIndex: 0,
                                                langs: [
                                                    {
                                                        orderIndex: 0,
                                                        title: "Req EN",
                                                        body: "Body TS EN",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        requirements: [
                                            {
                                                lang: "typescript",
                                                orderIndex: 0,
                                                langs: [
                                                    {
                                                        orderIndex: 0,
                                                        title: "Req VI",
                                                        body: "Body TS VI",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            ],
                            translateFields: [
                                "requirements.langs.title",
                                "requirements.langs.body",
                            ],
                        })

                        expect(merged.requirements?.[0]?.langs?.[0]).toMatchObject({
                            orderIndex: 0,
                            title: "Req EN",
                            body: "Body TS EN",
                        })
                        expect(merged.requirements?.[0]?.langs?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    locale: Locale.En,
                                    field: "title",
                                    value: "Req EN",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Req VI",
                                },
                                {
                                    locale: Locale.En,
                                    field: "body",
                                    value: "Body TS EN",
                                },
                                {
                                    locale: Locale.Vi,
                                    field: "body",
                                    value: "Body TS VI",
                                },
                            ]),
                        )
                        expect(merged.requirements?.[0]?.langs?.[0]?.translations).toHaveLength(4)
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

                it("falls back to the first locale and stringifies primitive and object leaves",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        title: null,
                                        score: 7,
                                        metadata: {
                                            source: "seed"
                                        },
                                    },
                                },
                            ],
                            translateFields: ["title",
                                "score",
                                "metadata"],
                        })

                        expect(merged.title).toBeNull()
                        expect(merged.translations).toEqual([
                            {
                                locale: Locale.Vi, field: "title", value: ""
                            },
                            {
                                locale: Locale.Vi, field: "score", value: "7"
                            },
                            {
                                locale: Locale.Vi, field: "metadata", value: "{\"source\":\"seed\"}"
                            },
                        ])
                    })

                it("skips unmatched nested array parents and non-object entries",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        groups: [{
                                            orderIndex: 1,
                                            items: [{
                                                orderIndex: 2, label: "English"
                                            }],
                                        }],
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        groups: [{
                                            orderIndex: 99,
                                            items: ["not-an-item",
                                                {
                                                    orderIndex: 3, label: "Other"
                                                }],
                                        }],
                                    },
                                },
                            ],
                            translateFields: ["groups.items.label"],
                        })

                        expect(merged.groups?.[0]?.items?.[0]).toMatchObject({
                            translations: [
                                {
                                    locale: Locale.En, field: "label", value: "English"
                                },
                            ]
                        })
                    })

                it("ignores paths that traverse scalar values and missing leaves",
                    () => {
                        const merged = service.merge({
                            jsons: [{
                                locale: Locale.En,
                                json: {
                                    metadata: "not-an-object",
                                    title: "Available",
                                },
                            }],
                            translateFields: ["metadata.source",
                                "missing",
                                "title"],
                        })

                        expect(merged.translations).toEqual([{
                            locale: Locale.En,
                            field: "title",
                            value: "Available",
                        }])
                    })

                it("handles malformed locale trees and sparse array translations safely",
                    () => {
                        const merged = service.merge({
                            jsons: [
                                {
                                    locale: Locale.En,
                                    json: {
                                        groups: [{
                                            orderIndex: 1,
                                            items: [{
                                                orderIndex: 2, label: "English"
                                            }],
                                        }],
                                        scalar: "value",
                                    },
                                },
                                {
                                    locale: Locale.Vi,
                                    json: {
                                        groups: [{
                                            orderIndex: 1,
                                            items: ["not-an-object"],
                                        }],
                                    },
                                },
                                {
                                    locale: Locale.En,
                                    json: ["malformed-root"] as never,
                                },
                            ],
                            translateFields: ["groups.items.label",
                                "scalar.source.leaf",
                                ""],
                        })

                        expect(merged.groups?.[0]?.items?.[0]).toMatchObject({
                            translations: [
                                {
                                    locale: Locale.En, field: "label", value: "English"
                                },
                            ]
                        })
                    })
            })
    })
