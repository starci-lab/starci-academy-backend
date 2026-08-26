import {
    PresignController
} from "./presign.controller"

describe("PresignController",
    () => {
        it("signs put/get URLs with encoded keys and upload metadata",
            () => {
                const controller = new PresignController({
                    generateObjectKey: jest.fn().mockReturnValue("uploads/a/b.png"),
                } as never)
                const request = {
                    protocol: "https",
                    headers: {
                        host: "client.test"
                    },
                } as never

                expect(controller.signPut({
                    filename: "b.png",
                    contentType: "image/png",
                },
                request)).toEqual({
                    key: "uploads/a/b.png",
                    url: "https://client.test/presign/object/uploads%2Fa%2Fb.png",
                    method: "PUT",
                    expiresInSeconds: 900,
                    filename: "b.png",
                })
                expect(controller.signGet("uploads/a/b.png",
                    request)).toEqual({
                    key: "uploads/a/b.png",
                    url: "https://client.test/presign/object/uploads%2Fa%2Fb.png",
                    expiresInSeconds: 900,
                })
            })

        it("stores raw request bytes and returns an MD5 ETag",
            async () => {
                const putObject = jest.fn()
                const controller = new PresignController({
                    putObject
                } as never)
                const response = {
                    setHeader: jest.fn(),
                    status: jest.fn().mockReturnThis(),
                    end: jest.fn(),
                }
                const request = {
                    headers: {
                        "content-type": "image/png"
                    },
                    on: (event: string, listener: (value?: Buffer) => void) => {
                        if (event === "data") listener(Buffer.from("hello"))
                        if (event === "end") listener()
                        return request
                    },
                }
                await controller.putObject("uploads/image.png",
request as never,
response as never)

                expect(putObject).toHaveBeenCalledWith(
                    "uploads/image.png",
                    Buffer.from("hello"),
                    "image/png",
                    "image.png",
                )
                expect(response.setHeader).toHaveBeenCalledWith("ETag",
                    "\"5d41402abc4b2a76b9719d911017c592\"")
                expect(response.status).toHaveBeenCalledWith(200)
                expect(response.end).toHaveBeenCalled()
            })
    })
