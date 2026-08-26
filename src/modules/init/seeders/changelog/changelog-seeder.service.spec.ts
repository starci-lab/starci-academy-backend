import {
    ChangelogSeederService
} from "./changelog-seeder.service"

describe("ChangelogSeederService",
    () => {
        it("honors the disabled seeder gate",
            async () => {
                const upsert = jest.fn()
                const service = new ChangelogSeederService({
                    upsert
                } as never,
{
    isChangelogSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
} as never,
{
} as never)
                await expect(service.seed()).resolves.toBeUndefined()
                expect(upsert).not.toHaveBeenCalled()
            })
    })
