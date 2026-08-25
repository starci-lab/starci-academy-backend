jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            assets: {
                dir: "missing-assets" 
            }, s3: {
                minio: {
                    bucket: "bucket" 
                } 
            } 
        }) 
    }))
jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getRuntimeContextRoot: () => null 
    }))
import {
    AssetsService 
} from "./assets.service"

describe("AssetsService",
    () => {
        it("returns an empty result and logs when the assets directory is absent",
            async () => {
                const log = jest.fn(); const service = new AssetsService({
                    buffer: jest.fn() 
                } as never,
{
    buildPublicObjectUrl: jest.fn() 
} as never,
{
    ensurePublicReadPrefixes: jest.fn() 
} as never,
{
    log 
} as never)
                await expect(service.sync()).resolves.toEqual({
                    assets: [] 
                }); expect(log).toHaveBeenCalled()
            })
        it("swallows initialization failures and logs a failed phase",
            async () => {
                const log = jest.fn(); const service = new AssetsService({
                    buffer: jest.fn() 
                } as never,
{
    buildPublicObjectUrl: jest.fn() 
} as never,
{
    ensurePublicReadPrefixes: jest.fn() 
} as never,
{
    log 
} as never)
                jest.spyOn(service,
                    "sync").mockRejectedValue(new Error("offline")); await service.onModuleInit(); expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        error: "offline" 
                    }))
            })
    })
