import {
    InterviewQuestionFieldsService
} from "./interview-question-fields.service"

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
