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
const mockStat = jest.fn()
const mockReaddir = jest.fn()
const mockReadFile = jest.fn()
jest.mock("node:fs",
    () => ({
        promises: {
            stat: (...args: Array<unknown>) => mockStat(...args),
            readdir: (...args: Array<unknown>) => mockReaddir(...args),
            readFile: (...args: Array<unknown>) => mockReadFile(...args),
        },
    }))
import {
    AssetsService
} from "./assets.service"

interface PublicAssetUrlParams {
    key: string
}

describe("AssetsService",
    () => {
        beforeEach(() => {
            mockStat.mockReset()
            mockReaddir.mockReset()
            mockReadFile.mockReset()
        })
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
        it("recursively uploads files with extension-specific and default content types",
            async () => {
                mockStat.mockResolvedValueOnce({
                    isDirectory: () => true,
                })
                mockReaddir.mockResolvedValueOnce([
                    {
                        name: "logo.svg",
                        isDirectory: () => false,
                        isFile: () => true,
                    },
                    {
                        name: "data.bin",
                        isDirectory: () => false,
                        isFile: () => true,
                    },
                ])
                mockReadFile
                    .mockResolvedValueOnce(Buffer.from("svg"))
                    .mockResolvedValueOnce(Buffer.from("binary"))
                const upload = {
                    buffer: jest.fn().mockResolvedValue(undefined),
                }
                const build = {
                    buildPublicObjectUrl: jest.fn(({ key }: PublicAssetUrlParams) => `https://cdn.test/${key}`),
                }
                const bucket = {
                    ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined),
                }
                const service = new AssetsService(upload as never,
                    build as never,
                    bucket as never,
                    {
                        log: jest.fn(),
                    } as never)

                await expect(service.sync()).resolves.toEqual({
                    assets: [
                        {
                            fileName: "logo.svg",
                            key: "assets/logo.svg",
                            url: "https://cdn.test/assets/logo.svg",
                        },
                        {
                            fileName: "data.bin",
                            key: "assets/data.bin",
                            url: "https://cdn.test/assets/data.bin",
                        },
                    ],
                })
                expect(bucket.ensurePublicReadPrefixes).toHaveBeenCalledWith("bucket")
                expect(upload.buffer).toHaveBeenNthCalledWith(1,
                    expect.objectContaining({
                        contentType: "image/svg+xml",
                    }))
                expect(upload.buffer).toHaveBeenNthCalledWith(2,
                    expect.objectContaining({
                        contentType: "application/octet-stream",
                    }))
            })
    })
