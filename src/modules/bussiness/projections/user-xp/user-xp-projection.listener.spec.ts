import {
    UserXpProjectionListener
} from "./user-xp-projection.listener"
describe("UserXpProjectionListener",
    () => {
        const projection = {
            recompute: jest.fn().mockResolvedValue(undefined)
        }
        const listener = new UserXpProjectionListener({
        } as never,
{
} as never,
projection as never)
        const exposedListener = listener as unknown as {
            deriveTargets: (event: unknown) => string[]
            recomputeTarget: (userId: string) => Promise<void>
        }
        it("targets users and XP rows, skipping missing identifiers",
            async () => {
                expect(exposedListener.deriveTargets({
                    topic: "cdc.users", row: {
                        id: "u"
                    }
                })).toEqual(["u"])
                expect(exposedListener.deriveTargets({
                    topic: "cdc.users", row: {
                    }
                })).toEqual([])
                expect(exposedListener.deriveTargets({
                    topic: "cdc.xp_histories", row: {
                        user_id: "u"
                    }
                })).toEqual(["u"])
                expect(exposedListener.deriveTargets({
                    topic: "cdc.xp_histories", row: {
                    }
                })).toEqual([])
                await exposedListener.recomputeTarget("u")
                expect(projection.recompute).toHaveBeenCalledWith({
                    userId: "u"
                })
            })
    })
