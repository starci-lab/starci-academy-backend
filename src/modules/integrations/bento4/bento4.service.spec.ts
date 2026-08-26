import {
    execaCommand
} from "execa"
import {
    Bento4Service
} from "./bento4.service"
import {
    Bento4NoMovieFoundException
} from "@modules/platform/exceptions/errors/bento4/bento4-no-movie-found"
import {
    Bento4Mp4FragmentException,
} from "@modules/platform/exceptions/errors/bento4/bento4-mp4-fragment"
import {
    Bento4Mp4DashException,
} from "@modules/platform/exceptions/errors/bento4/bento4-mp4-dash"
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

        it("returns false when fragment metadata is absent",
            async () => {
                exec.mockResolvedValueOnce({
                    stdout: "unrecognized metadata", stderr: "",
                })

                await expect(service.checkFragments("task",
                    "video.mp4")).resolves.toBe(false)
            })

        it("completes fragmenting and DASH generation when commands emit no errors",
            async () => {
                exec.mockResolvedValue({
                    stdout: "ok", stderr: "",
                })

                await expect(service.fragmentVideo("task",
                    "video.mp4")).resolves.toBeUndefined()
                await expect(service.generateMpegDashManifestFromFragments(
                    "task",
                    ["360.mp4",
                        "720.mp4"],
                )).resolves.toBeUndefined()
                expect(exec).toHaveBeenCalledTimes(2)
            })

        it("surfaces fragment and DASH stderr error markers",
            async () => {
                exec.mockResolvedValueOnce({
                    stdout: "", stderr: "ERROR: fragment failed",
                })
                await expect(service.fragmentVideo("task",
                    "video.mp4"))
                    .rejects.toBeInstanceOf(Bento4Mp4FragmentException)

                exec.mockResolvedValueOnce({
                    stdout: "ERROR: dash failed", stderr: "",
                })
                await expect(service.generateMpegDashManifestFromFragments(
                    "task",
                    ["video.mp4"],
                )).rejects.toBeInstanceOf(Bento4Mp4DashException)
            })
    })
