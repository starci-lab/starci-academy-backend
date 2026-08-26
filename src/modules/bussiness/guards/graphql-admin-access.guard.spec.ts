import {
    GraphQLAdminAccessGuard
} from "./graphql-admin-access.guard"
import {
    AdminApiKeyRequiredException
} from "@modules/platform/exceptions/errors/guards/admin-api-key-required"
describe("GraphQLAdminAccessGuard",
    () => {
        const context = (header: unknown) => ({
            getType: () => "graphql", getArgs: () => [{
            },
            {
            },
            {
                req: {
                    headers: {
                        "x-admin-api-key": header
                    }
                }
            },
            {
            }], getHandler: () => undefined, getClass: () => undefined
        } as never)
        it("accepts matching scalar and array headers",
            () => {
                const guard = new GraphQLAdminAccessGuard({
                    adminApiKey: "secret"
                } as never)
                expect(guard.canActivate(context("secret"))).toBe(true)
                expect(guard.canActivate(context(["secret"]))).toBe(true)
            })
        it("rejects missing headers",
            () => {
                const guard = new GraphQLAdminAccessGuard({
                    adminApiKey: "secret"
                } as never)
                expect(() => guard.canActivate(context(undefined))).toThrow(AdminApiKeyRequiredException)
            })
    })
