import {
    TusController
} from "./tus.controller"

describe("TusController",
    () => {
        it("creates an upload and sets tus headers",
            () => {
                const store = {
                    createTusUpload: jest.fn().mockReturnValue("id")
                }
                const response = {
                    setHeader: jest.fn(), status: jest.fn().mockReturnThis(), end: jest.fn()
                }
                new TusController(store as never).create({
                    headers: {
                        "upload-length": "5", "upload-metadata": ["name x"]
                    }, protocol: "https", get: jest.fn()
                } as never,
response as never)
                expect(store.createTusUpload).toHaveBeenCalledWith(5,
                    "name x")
                expect(response.status).toHaveBeenCalledWith(201)
            })
        it("probes an upload and omits absent metadata",
            () => {
                const response = {
                    setHeader: jest.fn(), status: jest.fn().mockReturnThis(), end: jest.fn()
                }
                new TusController({
                    getTusUpload: jest.fn().mockReturnValue({
                        buffer: Buffer.alloc(3), length: 5, metadata: ""
                    })
                } as never).probe("id",
response as never)
                expect(response.setHeader).toHaveBeenCalledWith("Upload-Offset",
                    "3")
                expect(response.setHeader).not.toHaveBeenCalledWith("Upload-Metadata",
                    expect.anything())
            })
    })
