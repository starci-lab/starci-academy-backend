import {
    getSignedUrl,
} from "@aws-sdk/s3-request-presigner"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    S3BuildService,
} from "./s3-build.service"
import {
    S3Provider,
} from "./enums/s3"

jest.mock("@aws-sdk/s3-request-presigner",
    () => ({
        getSignedUrl: jest.fn(() => Promise.resolve("https://signed.example/object")),
    }))
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

describe("S3BuildService",
    () => {
        const mockedEnvConfig = jest.mocked(envConfig)
        const mockedGetSignedUrl = jest.mocked(getSignedUrl)
        const config = {
            s3: {
                digitalOcean: {
                    endpoint: "https://digital.example",
                    publicEndpoint: "https://public.digital.example/",
                    bucket: "digital-bucket",
                    presignedUrl: {
                        expiration: 120000
                    },
                },
                minio: {
                    endpoint: "http://minio.local",
                    publicEndpoint: "",
                    bucket: "minio-bucket",
                    presignedUrl: {
                        expiration: 60000
                    },
                },
            },
        }
        const service = new S3BuildService({
        } as never,
{
} as never)

        beforeEach(() => {
            jest.clearAllMocks()
            mockedEnvConfig.mockReturnValue(config as ReturnType<typeof envConfig>)
        })

        it("uses the configured public endpoint and strips a trailing slash",
            () => {
                expect(service.buildPublicObjectUrl({
                    provider: S3Provider.DigitalOcean,
                    key: "folder/file.txt",
                })).toBe("https://public.digital.example/digital-bucket/folder/file.txt")
                expect(service.buildPublicObjectUrl({
                    provider: S3Provider.Minio,
                    key: "file.txt",
                })).toBe("http://minio.local/minio-bucket/file.txt")
            })

        it("selects provider bucket and honors a positive signed URL override",
            async () => {
                const result = await service.buildSignedGetObjectUrl({
                    provider: S3Provider.Minio,
                    key: "file.txt",
                    expiresInSeconds: 9,
                })

                expect(result).toBe("https://signed.example/object")
                expect(mockedGetSignedUrl).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    {
                        expiresIn: 9
                    },
                )
            })
    })
