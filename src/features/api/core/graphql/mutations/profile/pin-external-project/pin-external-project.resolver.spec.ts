import {
    PinExternalProjectResolver
} from "./pin-external-project.resolver"
import {
    MAX_PINNED_PROJECTS
} from "./constants"
import {
    PinnedProjectLimitReachedException
} from "@modules/platform/exceptions/errors/profile/pinned-project"

describe("PinExternalProjectResolver",
    () => {
        it("appends an external pin and defaults optional fields to null",
            async () => {
                const save = jest.fn().mockResolvedValue({
                    id: "pin-1"
                })
                const resolver = new PinExternalProjectResolver({
                    count: jest.fn().mockResolvedValue(2), save
                } as never)
                await expect(resolver.execute({
                    title: "Project", url: null
                } as never,
{
    id: "u1"
} as never)).resolves.toBe("pin-1")
                expect(save).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        orderIndex: 2, description: null, techStack: null
                    }))
            })

        it("rejects when the pin limit is reached",
            async () => {
                const resolver = new PinExternalProjectResolver({
                    count: jest.fn().mockResolvedValue(MAX_PINNED_PROJECTS), save: jest.fn()
                } as never)
                await expect(resolver.execute({
                    title: "Project"
                } as never,
{
    id: "u1"
} as never)).rejects.toBeInstanceOf(PinnedProjectLimitReachedException)
            })
    })
