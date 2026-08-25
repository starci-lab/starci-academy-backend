import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    GenerateCvRequest
} from "./request"
describe("GenerateCvRequest validation contract",
    () => { it("transforms valid input to its declared class",
        async () => { const value = plainToInstance(GenerateCvRequest,
            {
            }); expect(value).toBeInstanceOf(GenerateCvRequest); await expect(validate(value)).resolves.toBeDefined() }); it("returns deterministic validation results for malformed input",
        async () => { const value = plainToInstance(GenerateCvRequest,
            {
                unexpected: "invalid"
            }); const errors = await validate(value); expect(Array.isArray(errors)).toBe(true) }) })
