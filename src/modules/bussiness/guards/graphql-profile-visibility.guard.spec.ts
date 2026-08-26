import {
    GraphQLProfileVisibilityGuard
} from "./graphql-profile-visibility.guard"
import {
    ProfileNotVisibleException
} from "@modules/platform/exceptions/errors/guards/profile-not-visible"
describe("GraphQLProfileVisibilityGuard",
    () => {
        const context = (args: Record<string, unknown>, user?: unknown) => ({
            getType: () => "graphql", getArgs: () => [{
            },
            args,
            {
                req: {
                    user
                }
            },
            {
            }], getClass: () => undefined, getHandler: () => undefined
        } as never)
        it("allows missing target and owner profiles",
            async () => {
                const service = {
                    isProfileLocked: jest.fn()
                }
                const guard = new GraphQLProfileVisibilityGuard(service as never)
                await expect(guard.canActivate(context({
                }))).resolves.toBe(true)
                await expect(guard.canActivate(context({
                    userId: "u"
                },
                {
                    id: "u"
                }))).resolves.toBe(true)
                expect(service.isProfileLocked).not.toHaveBeenCalled()
            })
        it("rejects a locked profile for another viewer",
            async () => {
                const guard = new GraphQLProfileVisibilityGuard({
                    isProfileLocked: jest.fn().mockResolvedValue(true)
                } as never)
                await expect(guard.canActivate(context({
                    userId: "target"
                },
                {
                    id: "viewer"
                }))).rejects.toBeInstanceOf(ProfileNotVisibleException)
            })
    })
