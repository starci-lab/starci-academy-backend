import {
    isStringifiablePrimitive,
} from "./stringify-primitive"

describe("isStringifiablePrimitive",
    () => {
        it.each([
            "text",
            42,
            true,
            BigInt(1),
            Symbol("s"),
            undefined,
            () => undefined,
        ])("accepts %p",
            (value) => {
                expect(isStringifiablePrimitive(value)).toBe(true)
            })

        it.each([
            {
            },
            [
                1,
                2,
            ],
            null,
        ])("rejects %p",
            (value) => {
                expect(isStringifiablePrimitive(value)).toBe(false)
            })
    })
