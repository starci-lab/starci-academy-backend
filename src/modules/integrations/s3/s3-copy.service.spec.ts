import {
    S3CopyService
} from "./s3-copy.service"
import {
    S3Provider
} from "./enums/s3"
import {
    S3CopyUnsupportedProviderException
} from "@modules/platform/exceptions/errors/s3/copy-unsupported-provider"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn()
    }))
import {
    envConfig
} from "@modules/platform/env/config"

describe("S3CopyService",
    () => {
        it("skips same-key copies and rejects unsupported providers",
            async () => {
                const send = jest.fn()
                const service = new S3CopyService({
                    send
                } as never)
                await expect(service.copySameBucket({
                    sourceKey: "a", destKey: "a", provider: S3Provider.Minio
                })).resolves.toBeUndefined()
                expect(send).not.toHaveBeenCalled()
                await expect(service.copySameBucket({
                    sourceKey: "a", destKey: "b", provider: "digitalocean" as never
                })).rejects.toBeInstanceOf(S3CopyUnsupportedProviderException)
            })

        it("encodes source path segments and sends a copy command",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    s3: {
                        minio: {
                            bucket: "bucket"
                        }
                    }
                } as never)
                const send = jest.fn().mockResolvedValue(undefined)
                const service = new S3CopyService({
                    send
                } as never)
                await service.copySameBucket({
                    sourceKey: "folder/a file.txt", destKey: "dest.txt", provider: S3Provider.Minio
                })
                expect(send).toHaveBeenCalledWith(expect.objectContaining({
                    input: {
                        Bucket: "bucket", Key: "dest.txt", CopySource: "bucket/folder/a%20file.txt",
                    }
                }))
            })
    })
