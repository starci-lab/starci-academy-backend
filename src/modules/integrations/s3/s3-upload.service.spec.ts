import {
    PutObjectCommand, type S3Client 
} from "@aws-sdk/client-s3"
import {
    envConfig 
} from "@modules/platform/env/config"
import {
    AsyncService 
} from "@modules/lib/mixin/async.service"
import SuperJSON from "superjson"
import {
    Readable 
} from "node:stream"
import {
    S3Provider 
} from "./enums/s3"
import {
    S3UploadService 
} from "./s3-upload.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn() 
    }))

describe("S3UploadService",
    () => {
        const digitalOceanSend = jest.fn()
        const minioSend = jest.fn()
        const allMustDone = jest.fn(async (promises: Array<Promise<void>>) =>
            Promise.all(promises),
        )
        let service: S3UploadService

        beforeEach(() => {
            jest.clearAllMocks()
            jest.mocked(envConfig).mockReturnValue({
                s3: {
                    minio: {
                        bucket: "academy" 
                    },
                    digitalOcean: {
                        bucket: "production", accessKeyId: "do-key" 
                    },
                },
            } as ReturnType<typeof envConfig>)
            digitalOceanSend.mockResolvedValue({
            })
            minioSend.mockResolvedValue({
            })
            service = new S3UploadService(
      {
          send: digitalOceanSend 
      } as unknown as S3Client,
      {
          send: minioSend 
      } as unknown as S3Client,
      {
          allMustDone 
      } as unknown as AsyncService,
      new SuperJSON(),
            )
        })

        it("serializes plain JSON and uploads to MinIO",
            async () => {
                await service.json({
                    name: "lesson.json",
                    payload: {
                        id: 7 
                    },
                    acl: "public-read",
                    providers: [S3Provider.Minio],
                    encoding: "json",
                })
                const command = minioSend.mock.calls[0][0] as PutObjectCommand
                expect(command.input).toMatchObject({
                    Bucket: "academy",
                    Key: "lesson.json",
                    Body: "{\"id\":7}",
                    ContentType: "application/json",
                })
                expect(command.input.ACL).toBeUndefined()
                expect(allMustDone).toHaveBeenCalledTimes(1)
            })

        it("uploads to both enabled providers and preserves DigitalOcean ACL",
            async () => {
                await service.json({
                    name: "lesson.json",
                    payload: {
                        id: 1 
                    },
                    acl: "public-read",
                    providers: [S3Provider.DigitalOcean,
                        S3Provider.Minio],
                })
                expect(digitalOceanSend).toHaveBeenCalledTimes(1)
                expect(minioSend).toHaveBeenCalledTimes(1)
                expect(
                    (digitalOceanSend.mock.calls[0][0] as PutObjectCommand).input,
                ).toMatchObject({
                    Bucket: "production", ACL: "public-read" 
                })
            })

        it("skips DigitalOcean when credentials are absent",
            async () => {
                jest
                    .mocked(envConfig)
                    .mockReturnValue({
                        s3: {
                            minio: {
                                bucket: "academy" 
                            },
                            digitalOcean: {
                                bucket: "production", accessKeyId: "   " 
                            },
                        },
                    } as ReturnType<typeof envConfig>)
                await service.json({
                    name: "x",
                    payload: {
                    },
                    acl: "private",
                    providers: [S3Provider.DigitalOcean],
                })
                await service.buffer({
                    name: "x",
                    buffer: Buffer.from("x"),
                    acl: "private",
                    provider: S3Provider.DigitalOcean,
                })
                expect(digitalOceanSend).not.toHaveBeenCalled()
            })

        it("wraps JSON provider failures with upload context",
            async () => {
                const original = new Error("offline")
                minioSend.mockRejectedValue(original)
                await expect(
                    service.json({
                        name: "x",
                        payload: {
                        },
                        acl: "private",
                        providers: [S3Provider.Minio],
                    }),
                ).rejects.toMatchObject({
                    code: "S3_UPLOAD_FAILED_EXCEPTION" 
                })
            })

        it("uploads buffers and streams and rejects unknown providers",
            async () => {
                await service.buffer({
                    name: "a.pdf",
                    buffer: Buffer.from("pdf"),
                    acl: "private",
                    provider: S3Provider.Minio,
                    contentType: "application/pdf",
                })
                expect(
                    (minioSend.mock.calls[0][0] as PutObjectCommand).input,
                ).toMatchObject({
                    Bucket: "academy",
                    Key: "a.pdf",
                    ContentType: "application/pdf",
                })
                await service.stream({
                    name: "a.txt",
                    stream: Readable.from(["x"]),
                    acl: "private",
                    provider: S3Provider.Minio,
                })
                await expect(
                    service.buffer({
                        name: "x",
                        buffer: Buffer.alloc(0),
                        acl: "private",
                        provider: "other" as S3Provider,
                    }),
                ).rejects.toMatchObject({
                    code: "S3_PROVIDER_NOT_FOUND_EXCEPTION" 
                })
            })
    })
