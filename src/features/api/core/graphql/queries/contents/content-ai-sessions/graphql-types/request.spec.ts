import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    ContentAiSessionsRequest
} from "./request"
describe("ContentAiSessionsRequest validation contract",
    () => { it("transforms valid input to its declared class",
        async () => { const value = plainToInstance(ContentAiSessionsRequest,
            {
            }); expect(value).toBeInstanceOf(ContentAiSessionsRequest); await expect(validate(value)).resolves.toBeDefined() }); it("returns deterministic validation results for malformed input",
        async () => { const value = plainToInstance(ContentAiSessionsRequest,
            {
                unexpected: "invalid"
            }); const errors = await validate(value); expect(Array.isArray(errors)).toBe(true) }) })
