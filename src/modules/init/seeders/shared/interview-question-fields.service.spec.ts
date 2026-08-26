import {
    InterviewQuestionFieldsService
} from "./interview-question-fields.service"

describe("InterviewQuestionFieldsService normalization boundaries",
    () => {
        it("normalizes empty, wrapped, and non-finite helper inputs",
            () => {
                const service = new InterviewQuestionFieldsService({
                    toNullableString: jest.fn((value: string | undefined) => value ?? null),
                } as never) as unknown as {
                    mapIndexedValues: (items: Array<{ value?: string }> | undefined) => Array<string> | null
                    parseChipKeywords: (value: string | undefined) => Array<string> | null
                    toSortIndex: (value: unknown, fallback: number) => number
                }
                expect(service.mapIndexedValues(undefined)).toBeNull()
                expect(service.mapIndexedValues([{
                    value: " one "
                },
                {
                    value: " "
                }])).toEqual(["one"])
                expect(service.parseChipKeywords(":::chip\nOne\n\n:::" )).toEqual(["One"])
                expect(service.parseChipKeywords(" ")).toBeNull()
                expect(service.toSortIndex(" 9 ",
                    2)).toBe(9)
                expect(service.toSortIndex(Number.NaN,
                    2)).toBe(2)
            })
    })

describe("InterviewQuestionFieldsService",
    () => {
        it("coerces common fields and removes blank indexed/chip values",
            () => {
                const coerce = {
                    toRequiredString: jest.fn((value: unknown, fallback: string) => typeof value === "string" ? value : fallback), toNullableStringColumn: jest.fn((value: unknown) => value ?? null), toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback), toNullableString: jest.fn((value: string | undefined) => value ?? null)
                }
                const result = new InterviewQuestionFieldsService(coerce as never).parseCommonFields({
                    kind: "q", prompt: "Prompt", keywords: ":::chip\none\n\ntrue\n:::", rubric: [{
                        value: " one "
                    },
                    {
                        value: " "
                    }], sortIndex: "bad"
                } as never,
                "technical",
                4)
                expect(result).toEqual(expect.objectContaining({
                    family: "technical", kind: "q", prompt: "Prompt", rubric: ["one"], keywords: ["one",
                        "true"], sortIndex: 4, isPremium: false
                }))
            })

        it("uses scalar fallbacks for absent optional question fields",
            () => {
                const coerce = {
                    toRequiredString: jest.fn().mockReturnValue("fallback"),
                    toNullableStringColumn: jest.fn().mockReturnValue(null),
                    toRequiredBoolean: jest.fn().mockReturnValue(true),
                    toNullableString: jest.fn().mockReturnValue(null),
                }

                const result = new InterviewQuestionFieldsService(
                    coerce as never,
                ).parseCommonFields(
                    {
                    },
                    "behavioral",
                    2,
                )

                expect(result).toEqual(expect.objectContaining({
                    family: "fallback",
                    kind: "fallback",
                    prompt: "fallback",
                    rubric: null,
                    keywords: null,
                    sortIndex: 2,
                    isPremium: true,
                }))
            })
    })
