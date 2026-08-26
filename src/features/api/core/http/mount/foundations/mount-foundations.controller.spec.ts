import {
    MountFoundationsController
} from "./mount-foundations.controller"
import {
    MountFoundationsFileNotFoundException
} from "@modules/platform/exceptions/errors/mount/foundations-file-not-found"
describe("MountFoundationsController",
    () => {
        it("joins path segments, selects content type, and sends the file",
            async () => {
                const readFile = jest.fn().mockResolvedValue({
                    absolutePath: "/x/readme.md", buffer: Buffer.from("ok")
                })
                const response = {
                    type: jest.fn(), send: jest.fn()
                }
                const controller = new MountFoundationsController({
                    readFile
                } as never)
                await controller.getFile(["guide",
                    "readme.md"],
response as never)
                expect(readFile).toHaveBeenCalledWith("guide/readme.md")
                expect(response.type).toHaveBeenCalledWith("text/markdown; charset=utf-8")
                expect(response.send).toHaveBeenCalled()
            })
        it("maps file read errors to the HTTP not-found exception",
            async () => {
                const controller = new MountFoundationsController({
                    readFile: jest.fn().mockRejectedValue(new Error("missing"))
                } as never)
                await expect(controller.getFile("missing.json",
{
    type: jest.fn(), send: jest.fn()
} as never)).rejects.toBeInstanceOf(MountFoundationsFileNotFoundException)
            })
    })
