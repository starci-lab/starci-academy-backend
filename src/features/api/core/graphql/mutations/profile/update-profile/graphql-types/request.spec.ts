import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    UpdateProfileRequest
} from "./request"

describe("UpdateProfileRequest validation",
    () => {
        it("accepts optional partial updates and valid URL/color fields",
            async () => {
                const request = plainToInstance(UpdateProfileRequest,
                    {
                        displayName: "Alice", avatar: "https://example.com/avatar.png", profileLocked: true, accentColor: "#abc123"
                    })
                await expect(validate(request)).resolves.toEqual([])
            })
        it("rejects malformed URL, boolean, color, and max-length values",
            async () => {
                const request = plainToInstance(UpdateProfileRequest,
                    {
                        avatar: "bad", linkedinUrl: "bad", profileLocked: "yes", accentColor: "red", displayName: "x".repeat(101)
                    })
                const errors = await validate(request)
                expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["avatar",
                    "linkedinUrl",
                    "profileLocked",
                    "accentColor",
                    "displayName"]))
            })
    })
