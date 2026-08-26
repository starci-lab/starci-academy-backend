import {
    AdvertisementSeederService
} from "./advertisement-seeder.service"

describe("AdvertisementSeederService",
    () => {
        it("honors the disabled seeder gate",
            async () => {
                const upsert = jest.fn()
                const service = new AdvertisementSeederService({
                    upsert
                } as never,
{
    isAdvertisementsSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
} as never,
{
} as never)
                await expect(service.seed()).resolves.toBeUndefined()
                expect(upsert).not.toHaveBeenCalled()
            })
    })
