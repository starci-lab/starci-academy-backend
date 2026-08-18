import {
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    NoSuchKey,
    type S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Readable,
} from "stream"
import type SuperJSON from "superjson"
import {
    S3Provider,
} from "./enums/s3"
import {
    S3ReadService,
} from "./s3-read.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

describe("S3ReadService",
    () => {
        const minioSend = jest.fn()
        const digitalOceanSend = jest.fn()
        const superJsonParse = jest.fn()
        let service: S3ReadService

        /** The AWS error thrown when a key is absent from the bucket. */
        const noSuchKey = () => new NoSuchKey({
            $metadata: {
            },
            message: "The specified key does not exist.",
        })

        /** An async-iterable body that is NOT a Node `Readable` (S3-compatible endpoints). */
        const asyncIterableBody = (
            chunks: Array<unknown>,
        ) => ({
            [Symbol.asyncIterator]: async function* () {
                for (const chunk of chunks) {
                    yield chunk
                }
            },
        })

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
            service = new S3ReadService(
                {
                    send: digitalOceanSend,
                } as unknown as S3Client,
                {
                    send: minioSend,
                } as unknown as S3Client,
                {
                    parse: superJsonParse,
                } as unknown as SuperJSON,
            )
        })

        describe("text",
            () => {
                it("reads a MinIO object through the MinIO client and its bucket",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: Readable.from([
                                Buffer.from("hello ",
                                    "utf8"),
                                Buffer.from("world",
                                    "utf8"),
                            ]),
                        })

                        await expect(service.text({
                            key: "contents/c1/vi.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBe("hello world")

                        expect(digitalOceanSend).not.toHaveBeenCalled()
                        const command = minioSend.mock.calls[0][0] as GetObjectCommand
                        expect(command).toBeInstanceOf(GetObjectCommand)
                        expect(command.input).toEqual({
                            Bucket: "starci-academy",
                            Key: "contents/c1/vi.json",
                        })
                    })

                it("reads a DigitalOcean object through the DigitalOcean client and its bucket",
                    async () => {
                        digitalOceanSend.mockResolvedValue({
                            Body: Readable.from([
                                Buffer.from("spaces",
                                    "utf8"),
                            ]),
                        })

                        await expect(service.text({
                            key: "courses/c1/vi.json",
                            provider: S3Provider.DigitalOcean,
                        })).resolves.toBe("spaces")

                        expect(minioSend).not.toHaveBeenCalled()
                        const command = digitalOceanSend.mock.calls[0][0] as GetObjectCommand
                        expect(command.input).toMatchObject({
                            Bucket: "starci-production",
                        })
                    })

                it("concatenates string and Uint8Array chunks and drops chunks of any other shape",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: asyncIterableBody([
                                "abc",
                                new Uint8Array([
                                    100,
                                    101,
                                ]),
                                42,
                            ]),
                        })

                        // "abc" + "de"; the stray number contributes nothing
                        await expect(service.text({
                            key: "mixed.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBe("abcde")
                    })

                it("returns an empty string when the response carries no body",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: undefined,
                        })

                        await expect(service.text({
                            key: "empty.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBe("")
                    })

                it("returns an empty string when the body is neither a stream nor async-iterable",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: {
                                notAStream: true,
                            },
                        })

                        await expect(service.text({
                            key: "weird.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBe("")
                    })

                it("returns null for a missing key",
                    async () => {
                        minioSend.mockRejectedValue(noSuchKey())

                        await expect(service.text({
                            key: "gone.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBeNull()
                    })

                it("returns null when the endpoint fails with a non-AWS error shape",
                    async () => {
                        minioSend.mockRejectedValue(new Error("ECONNREFUSED"))

                        await expect(service.text({
                            key: "gone.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBeNull()
                    })
            })

        describe("json",
            () => {
                it("parses the object body through SuperJSON",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: Readable.from([
                                Buffer.from("{\"json\":{\"id\":\"c1\"},\"meta\":{}}",
                                    "utf8"),
                            ]),
                        })
                        superJsonParse.mockReturnValue({
                            id: "c1",
                        })

                        await expect(service.json({
                            key: "contents/c1/vi.json",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual({
                            id: "c1",
                        })

                        expect(superJsonParse).toHaveBeenCalledWith("{\"json\":{\"id\":\"c1\"},\"meta\":{}}")
                    })

                it("returns null without parsing when the key is missing",
                    async () => {
                        minioSend.mockRejectedValue(noSuchKey())

                        await expect(service.json({
                            key: "gone.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBeNull()

                        expect(superJsonParse).not.toHaveBeenCalled()
                    })
            })

        describe("buffer",
            () => {
                it("returns the concatenated bytes from MinIO",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: Readable.from([
                                Buffer.from([
                                    1,
                                    2,
                                ]),
                                Buffer.from([
                                    3,
                                ]),
                            ]),
                        })

                        const result = await service.buffer({
                            key: "assets/logo.png",
                            provider: S3Provider.Minio,
                        })

                        expect(result).toEqual(Buffer.from([
                            1,
                            2,
                            3,
                        ]))
                    })

                it("reads through the DigitalOcean client and normalizes string/Uint8Array/other chunks",
                    async () => {
                        digitalOceanSend.mockResolvedValue({
                            Body: asyncIterableBody([
                                "ab",
                                new Uint8Array([
                                    99,
                                ]),
                                null,
                            ]),
                        })

                        const result = await service.buffer({
                            key: "assets/logo.png",
                            provider: S3Provider.DigitalOcean,
                        })

                        expect(result?.toString("utf8")).toBe("abc")
                        expect(digitalOceanSend.mock.calls[0][0].input).toMatchObject({
                            Bucket: "starci-production",
                        })
                    })

                it("returns an empty buffer when the response carries no body",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: undefined,
                        })

                        await expect(service.buffer({
                            key: "empty.bin",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual(Buffer.alloc(0))
                    })

                it("returns an empty buffer when the body is neither a stream nor async-iterable",
                    async () => {
                        minioSend.mockResolvedValue({
                            Body: {
                                notAStream: true,
                            },
                        })

                        await expect(service.buffer({
                            key: "weird.bin",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual(Buffer.alloc(0))
                    })

                it("returns null for a missing key",
                    async () => {
                        minioSend.mockRejectedValue(noSuchKey())

                        await expect(service.buffer({
                            key: "gone.bin",
                            provider: S3Provider.Minio,
                        })).resolves.toBeNull()
                    })

                it("returns null on a non-AWS transport failure",
                    async () => {
                        minioSend.mockRejectedValue(new Error("socket hang up"))

                        await expect(service.buffer({
                            key: "gone.bin",
                            provider: S3Provider.Minio,
                        })).resolves.toBeNull()
                    })
            })

        describe("list",
            () => {
                it("appends the trailing slash and returns the folder segments under the prefix",
                    async () => {
                        minioSend.mockResolvedValue({
                            CommonPrefixes: [
                                {
                                    Prefix: "courses/course-1/",
                                },
                                {
                                    Prefix: "courses/course-2/",
                                },
                            ],
                        })

                        await expect(service.list({
                            key: "courses",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual([
                            "course-1",
                            "course-2",
                        ])

                        const command = minioSend.mock.calls[0][0] as ListObjectsV2Command
                        expect(command).toBeInstanceOf(ListObjectsV2Command)
                        expect(command.input).toEqual({
                            Bucket: "starci-academy",
                            Prefix: "courses/",
                            Delimiter: "/",
                        })
                    })

                it("keeps an already-slashed key as the prefix and reads the DigitalOcean bucket",
                    async () => {
                        digitalOceanSend.mockResolvedValue({
                            CommonPrefixes: [
                                {
                                    Prefix: "courses/course-9/",
                                },
                            ],
                        })

                        await expect(service.list({
                            key: "courses/",
                            provider: S3Provider.DigitalOcean,
                        })).resolves.toEqual([
                            "course-9",
                        ])

                        expect(digitalOceanSend.mock.calls[0][0].input).toEqual({
                            Bucket: "starci-production",
                            Prefix: "courses/",
                            Delimiter: "/",
                        })
                    })

                it("returns an empty list when the prefix holds no common prefixes",
                    async () => {
                        minioSend.mockResolvedValue({
                        })

                        await expect(service.list({
                            key: "courses",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual([])
                    })
            })

        describe("listAll",
            () => {
                it("follows pagination and returns every flat key, skipping entries without one",
                    async () => {
                        minioSend
                            .mockResolvedValueOnce({
                                Contents: [
                                    {
                                        Key: "courses/a.json",
                                    },
                                    {
                                        Key: undefined,
                                    },
                                ],
                                IsTruncated: true,
                                NextContinuationToken: "page-2",
                            })
                            .mockResolvedValueOnce({
                                Contents: [
                                    {
                                        Key: "courses/b.json",
                                    },
                                ],
                                IsTruncated: false,
                            })

                        await expect(service.listAll({
                            prefix: "courses/",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual([
                            "courses/a.json",
                            "courses/b.json",
                        ])

                        expect(minioSend).toHaveBeenCalledTimes(2)
                        expect(minioSend.mock.calls[0][0].input).toEqual({
                            Bucket: "starci-academy",
                            Prefix: "courses/",
                            ContinuationToken: undefined,
                        })
                        expect(minioSend.mock.calls[1][0].input).toMatchObject({
                            ContinuationToken: "page-2",
                        })
                    })

                it("returns an empty list for an empty prefix on DigitalOcean",
                    async () => {
                        digitalOceanSend.mockResolvedValue({
                        })

                        await expect(service.listAll({
                            prefix: "courses/",
                            provider: S3Provider.DigitalOcean,
                        })).resolves.toEqual([])

                        expect(digitalOceanSend.mock.calls[0][0].input).toMatchObject({
                            Bucket: "starci-production",
                        })
                    })

                it("stops after one page when S3 reports truncation without a continuation token",
                    async () => {
                        minioSend.mockResolvedValueOnce({
                            Contents: [
                                {
                                    Key: "courses/a.json",
                                },
                            ],
                            IsTruncated: true,
                            NextContinuationToken: undefined,
                        })

                        await expect(service.listAll({
                            prefix: "courses/",
                            provider: S3Provider.Minio,
                        })).resolves.toEqual([
                            "courses/a.json",
                        ])

                        expect(minioSend).toHaveBeenCalledTimes(1)
                    })
            })

        describe("exists",
            () => {
                it("issues a HEAD against the MinIO bucket and reports the key as present",
                    async () => {
                        minioSend.mockResolvedValue({
                        })

                        await expect(service.exists({
                            key: "contents/c1/vi.json",
                            provider: S3Provider.Minio,
                        })).resolves.toBe(true)

                        const command = minioSend.mock.calls[0][0] as HeadObjectCommand
                        expect(command).toBeInstanceOf(HeadObjectCommand)
                        expect(command.input).toEqual({
                            Bucket: "starci-academy",
                            Key: "contents/c1/vi.json",
                        })
                    })

                it("reports a missing DigitalOcean key as absent",
                    async () => {
                        digitalOceanSend.mockRejectedValue(noSuchKey())

                        await expect(service.exists({
                            key: "gone.json",
                            provider: S3Provider.DigitalOcean,
                        })).resolves.toBe(false)

                        expect(digitalOceanSend.mock.calls[0][0].input).toMatchObject({
                            Bucket: "starci-production",
                        })
                    })

                it("rethrows a permission failure instead of reporting the key as absent",
                    async () => {
                        const accessDenied = new Error("AccessDenied")
                        minioSend.mockRejectedValue(accessDenied)

                        await expect(service.exists({
                            key: "private.json",
                            provider: S3Provider.Minio,
                        })).rejects.toBe(accessDenied)
                    })
            })
    })
