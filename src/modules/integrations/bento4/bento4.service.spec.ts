import {
    Bento4Service 
} from "./bento4.service"
import {
    execaCommand 
} from "execa"
jest.mock("execa",
    () => ({
        execaCommand: jest.fn() 
    }))
describe("Bento4Service",
    () => {
        it("detects fragmented and unfragmented files",
            async () => { const run = jest.mocked(execaCommand); run.mockResolvedValueOnce({
                stdout: "fragments:  yes", stderr: "" 
            } as never); await expect(new Bento4Service().checkFragments("/tmp",
                "a.mp4")).resolves.toBe(false); run.mockResolvedValueOnce({
                    stdout: "fragments:  no", stderr: "" 
                } as never); await expect(new Bento4Service().checkFragments("/tmp",
                "a.mp4")).resolves.toBe(true) })
        it("raises when Bento4 reports no movie or an encoding error",
            async () => { const run = jest.mocked(execaCommand); run.mockResolvedValueOnce({
                stdout: "No movie found in the file", stderr: "" 
            } as never); await expect(new Bento4Service().checkFragments("/tmp",
                "bad.mp4")).rejects.toThrow(); run.mockResolvedValueOnce({
                    stdout: "ERROR failed", stderr: "" 
                } as never); await expect(new Bento4Service().fragmentVideo("/tmp",
                "bad.mp4")).rejects.toThrow() })
    })
