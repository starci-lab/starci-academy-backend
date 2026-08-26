import {
    S3BucketService,
} from "./s3-bucket.service"

describe("S3BucketService",
    () => {
        it("reports bucket existence for healthy, unexpected, and failed head requests",
            async () => {
                const send = jest.fn()
                const service = new S3BucketService({
                    send
                } as never,
{
} as never)

                send.mockResolvedValueOnce({
                    $metadata: {
                        httpStatusCode: 200,
                    },
                })
                await expect(service.checkExists("academy")).resolves.toBe(true)
                send.mockResolvedValueOnce({
                    $metadata: {
                        httpStatusCode: 404,
                    },
                })
                await expect(service.checkExists("academy")).resolves.toBe(false)
                send.mockRejectedValueOnce(new Error("offline"))
                await expect(service.checkExists("academy")).resolves.toBe(false)
                expect(send).toHaveBeenCalledTimes(3)
            })

        it("creates a bucket on HTTP 200 and maps provider failures to a typed error",
            async () => {
                const send = jest.fn().mockResolvedValue({
                    $metadata: {
                        httpStatusCode: 200,
                    },
                })
                const service = new S3BucketService({
                    send
                } as never,
{
} as never)

                await expect(service.create("academy")).resolves.toBeUndefined()
                send.mockRejectedValueOnce(Object.assign(new Error("denied"),
                    {
                        Code: "AccessDenied",
                        RequestId: "request-1",
                        Resource: "academy",
                        $metadata: {
                            httpStatusCode: 403,
                        },
                    }))
                await expect(service.create("academy")).rejects.toThrow()
                expect(send).toHaveBeenCalledTimes(2)
            })

        it("rejects non-200 creation and applies all public prefix resources",
            async () => {
                const send = jest.fn().mockResolvedValue({
                    $metadata: {
                        httpStatusCode: 201,
                    },
                })
                const service = new S3BucketService({
                    send
                } as never,
{
    send
} as never)

                await expect(service.create("academy")).rejects.toThrow()
                send.mockResolvedValueOnce({
                })
                await expect(service.ensurePublicReadPrefixes("academy")).resolves.toBeUndefined()
                const command = send.mock.calls[1]?.[0] as {
                    input: {
                        Bucket: string
                        Policy: string
                    }
                }
                const policy = JSON.parse(command.input.Policy) as {
                    Statement: Array<{ Resource: Array<string> }>
                }
                expect(command.input.Bucket).toBe("academy")
                expect(policy.Statement[0]?.Resource).toEqual(expect.arrayContaining([
                    "arn:aws:s3:::academy/repo/*",
                    "arn:aws:s3:::academy/assets/*",
                ]))
            })
    })
