import {
    CoerceMdScalarService,
} from "./coerce-md-scalar.service"

enum SampleStatus {
    Ready = "ready",
    Failed = "failed",
}

enum SampleNumeric {
    First = 1,
    Second = 2,
}

describe("CoerceMdScalarService",
    () => {
        const service = new CoerceMdScalarService()

        it("normalizes nullable and required strings",
            () => {
                expect(service.toNullableString("  hello  ")).toBe("hello")
                expect(service.toNullableString(" null ")).toBeUndefined()
                expect(service.toNullableString(42)).toBeUndefined()
                expect(service.toRequiredString(undefined,
                    "fallback")).toBe("fallback")
                expect(service.toNullableStringColumn(" ")).toBeNull()
            })

        it("parses finite numeric values and rejects invalid input",
            () => {
                expect(service.toNullableNumber(" 3.5 ")).toBe(3.5)
                expect(service.toNullableNumber(4)).toBe(4)
                expect(service.toNullableNumber("Infinity")).toBeUndefined()
                expect(service.toNullableNumber("null")).toBeUndefined()
                expect(service.toNullableNumber(false)).toBeUndefined()
                expect(service.toRequiredNumber("bad",
                    9)).toBe(9)
                expect(service.toNullableNumericColumn("bad")).toBeNull()
            })

        it("resolves enum keys, values, numeric strings, and fallback values",
            () => {
                expect(service.toNullableEnum("Ready",
                    SampleStatus)).toBe(SampleStatus.Ready)
                expect(service.toNullableEnum("ready",
                    SampleStatus)).toBe(SampleStatus.Ready)
                expect(service.toNullableEnum("2",
                    SampleNumeric)).toBe("Second")
                expect(service.toNullableEnum("unknown",
                    SampleStatus)).toBeUndefined()
                expect(service.toNullableEnum("null",
                    SampleStatus)).toBeUndefined()
                expect(service.toRequiredEnum("unknown",
                    SampleStatus,
                    SampleStatus.Failed)).toBe(SampleStatus.Failed)
                expect(service.unsafeToEnum<SampleStatus>("ready")).toBe("ready")
            })

        it("coerces booleans from primitive and markdown representations",
            () => {
                expect(service.toNullableBoolean(true)).toBe(true)
                expect(service.toNullableBoolean(0)).toBe(false)
                expect(service.toNullableBoolean(" TRUE ")).toBe(true)
                expect(service.toNullableBoolean("false")).toBe(false)
                expect(service.toNullableBoolean(2)).toBeUndefined()
                expect(service.toNullableBoolean("maybe")).toBeUndefined()
                expect(service.toRequiredBoolean(undefined,
                    true)).toBe(true)
            })

        it("converts valid dates and rejects empty or malformed dates",
            () => {
                expect(service.toNullableDate("2026-01-15")).toEqual(new Date("2026-01-15"))
                expect(service.toNullableDate(" ")).toBeNull()
                expect(service.toNullableDate("not-a-date")).toBeNull()
                expect(service.toNullableDate(123)).toBeNull()
            })
    })
