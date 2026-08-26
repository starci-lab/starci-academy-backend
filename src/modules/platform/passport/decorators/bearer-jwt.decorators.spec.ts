import {
    extractBearerJwtFromAuthorizationHeader
} from "./bearer-jwt.decorators"

describe("extractBearerJwtFromAuthorizationHeader",
    () => {
        const extractHeader = extractBearerJwtFromAuthorizationHeader as unknown as (
            header: unknown,
        ) => string | undefined

        it.each([undefined,
            null,
            "",
            "Basic abc",
            ["Basic abc"]])("returns null for invalid headers: %p",
            (header) => {
                expect(extractHeader(header)).toBeUndefined()
            })
        it("trims a bearer token and handles arrays",
            () => {
                expect(extractBearerJwtFromAuthorizationHeader(" Bearer  token ")).toBe("token")
                expect(extractHeader(["Bearer array-token"])).toBe("array-token")
            })
    })
