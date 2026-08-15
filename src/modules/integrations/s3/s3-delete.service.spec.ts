import {
    ChecksumAlgorithm,
    DeleteObjectsCommand,
    type S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    S3Provider,
} from "./enums/s3"
import {
    S3DeleteService,
} from "./s3-delete.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

describe("S3DeleteService",
    () => {
        const minioSend = jest.fn()
        const digitalOceanSend = jest.fn()
        let service: S3DeleteService

        beforeEach(() => {
            jest.clearAllMocks()
            jest.mocked(envConfig).mockReturnValue({
                s3: {
                    minio: {
                        bucket: "starci-academy",
                    },
                    digitalOcean: {
                        bucket: "starci-production",
                    },
                },
            } as ReturnType<typeof envConfig>)
            minioSend.mockResolvedValue(undefined)
            digitalOceanSend.mockResolvedValue(undefined)
            service = new S3DeleteService(
                {
                    send: digitalOceanSend,
                } as unknown as S3Client,
                {
                    send: minioSend,
                } as unknown as S3Client,
            )
        })

        it("requests an MD5 checksum for MinIO multi-delete bodies",
            async () => {
                await expect(service.deleteObjects({
                    keys: [
                        "courses/ghost/vi.json",
                    ],
                    provider: S3Provider.Minio,
                })).resolves.toBe(1)

                expect(minioSend).toHaveBeenCalledTimes(1)
                const command = minioSend.mock.calls[0][0] as DeleteObjectsCommand
                expect(command.input).toMatchObject({
                    Bucket: "starci-academy",
                    ChecksumAlgorithm: ChecksumAlgorithm.MD5,
                    Delete: {
                        Objects: [
                            {
                                Key: "courses/ghost/vi.json",
                            },
                        ],
                        Quiet: true,
                    },
                })
            })

        it("does not send an invalid empty multi-delete request",
            async () => {
                await expect(service.deleteObjects({
                    keys: [],
                    provider: S3Provider.Minio,
                })).resolves.toBe(0)

                expect(minioSend).not.toHaveBeenCalled()
            })
    })
