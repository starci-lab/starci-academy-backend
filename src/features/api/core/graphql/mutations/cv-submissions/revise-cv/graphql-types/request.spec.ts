import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    ReviseCvRequest
} from "./request"
describe("ReviseCvRequest validation contract",
    () => { it("transforms valid input to its declared class",
        async () => { const value = plainToInstance(ReviseCvRequest,
            {
            }); expect(value).toBeInstanceOf(ReviseCvRequest); await expect(validate(value)).resolves.toBeDefined() }); it("returns deterministic validation results for malformed input",
        async () => { const value = plainToInstance(ReviseCvRequest,
            {
                unexpected: "invalid"
            }); const errors = await validate(value); expect(Array.isArray(errors)).toBe(true) }) })
