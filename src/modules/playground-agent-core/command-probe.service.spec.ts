import {
    CommandProbeService,
} from "./command-probe.service"

describe("CommandProbeService",
    () => {
        it("splits and trims non-empty output lines",
            () => {
                expect(new CommandProbeService().lines("  one\r\n\n two \n")).toEqual([
                    "one",
                    "two",
                ])
            })

        it("returns empty output when the probed binary fails",
            async () => {
                await expect(new CommandProbeService().run("definitely-not-a-command")).resolves.toBe("")
            })
    })
