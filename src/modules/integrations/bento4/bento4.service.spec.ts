import {
    execaCommand
} from "execa"
import {
    Bento4Service
} from "./bento4.service"
import {
    Bento4NoMovieFoundException
} from "@modules/platform/exceptions/errors/bento4/bento4-no-movie-found"
jest.mock("execa",
    () => ({
        execaCommand: jest.fn()
    }))
describe("Bento4Service",
    () => {
        const exec = execaCommand as unknown as jest.Mock
        const service = new Bento4Service()
        beforeEach(() => jest.clearAllMocks())
        it("detects already fragmented and unfragmented files",
            async () => {
                exec.mockResolvedValueOnce({
                    stdout: "fragments:  yes", stderr: ""
                })
                await expect(service.checkFragments("task",
                    "video.mp4")).resolves.toBe(false)
                exec.mockResolvedValueOnce({
                    stdout: "", stderr: "fragments:  no"
                })
                await expect(service.checkFragments("task",
                    "video.mp4")).resolves.toBe(true)
            })
        it("maps missing movies and command errors",
            async () => {
                exec.mockResolvedValueOnce({
                    stdout: "No movie found in the file", stderr: ""
                })
                await expect(service.checkFragments("task",
                    "video.mp4")).rejects.toBeInstanceOf(Bento4NoMovieFoundException)
                exec.mockResolvedValueOnce({
                    stdout: "ERROR: bad", stderr: ""
                })
                await expect(service.fragmentVideo("task",
                    "video.mp4")).rejects.toThrow()
            })
    })
