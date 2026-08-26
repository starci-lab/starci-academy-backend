import {
    ModuleHydrationService,
} from "./module-hydration.service"

describe("ModuleHydrationService",
    () => {
        it("throws when the module does not exist",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    find: jest.fn(),
                }
                const service = new ModuleHydrationService(manager as never)

                await expect(service.loadById("missing-module")).rejects.toThrow()
                expect(manager.find).not.toHaveBeenCalled()
            })

        it("hydrates previews, contents, and nested challenges as plain objects",
            async () => {
                const toPlain = <T extends object>(value: T) => ({
                    ...value,
                    toPlain: jest.fn(() => ({
                        ...value
                    })),
                })
                const challenge = toPlain({
                    id: "challenge-1"
                })
                const content = {
                    ...toPlain({
                        id: "content-1"
                    }),
                    challenges: [challenge],
                }
                const moduleRow = toPlain({
                    id: "module-1"
                })
                const manager = {
                    findOne: jest.fn().mockResolvedValue(moduleRow),
                    find: jest.fn()
                        .mockResolvedValueOnce([toPlain({
                            id: "preview-1"
                        })])
                        .mockResolvedValueOnce([content]),
                }
                const service = new ModuleHydrationService(manager as never)

                const result = await service.loadById("module-1")

                expect(result.id).toBe("module-1")
                expect(result.previewContents).toHaveLength(1)
                expect(result.contents?.[0]?.id).toBe("content-1")
                expect(result.contents?.[0]?.challenges).toHaveLength(1)
                expect(manager.find).toHaveBeenCalledTimes(2)
            })
    })
