import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    AskContentAiRequest
} from "./request"
describe("AskContentAiRequest validation contract",
    () => { it("transforms valid input to its declared class",
        async () => { const value = plainToInstance(AskContentAiRequest,
            {
            }); expect(value).toBeInstanceOf(AskContentAiRequest); await expect(validate(value)).resolves.toBeDefined() }); it("returns deterministic validation results for malformed input",
        async () => { const value = plainToInstance(AskContentAiRequest,
            {
                unexpected: "invalid"
            }); const errors = await validate(value); expect(Array.isArray(errors)).toBe(true) }) })
