import {
    AgentCommand
} from "./agent.command"

describe("AgentCommand",
    () => {
        it("parses options directly",
            () => {
                const command = new AgentCommand({
                    cliName: "agent", packageName: "pkg"
                } as never,
{
} as never,
{
} as never)
                expect(command.parseServer("https://server/")).toBe("https://server/")
                expect(command.parseInstall()).toBe(true)
                expect(command.parseUninstall()).toBe(true)
            })
        it("uninstalls without requiring a pairing code",
            async () => {
                const installer = {
                    uninstall: jest.fn()
                }
                await new AgentCommand({
                    cliName: "agent", packageName: "pkg"
                } as never,
{
} as never,
installer as never).run([],
                    {
                        uninstallService: true
                    })
                expect(installer.uninstall).toHaveBeenCalled()
            })

        it("returns the server option without altering its value",
            () => {
                const command = new AgentCommand({
                    cliName: "agent",
                    packageName: "agent",
                } as never,
{
} as never,
{
} as never)

                expect(command.parseServer("https://api.example/")).toBe("https://api.example/")
            })

        it("installs with a normalized server URL when a pairing code is supplied",
            async () => {
                const installer = {
                    install: jest.fn(),
                    uninstall: jest.fn(),
                }
                const command = new AgentCommand({
                    cliName: "agent",
                    packageName: "agent",
                } as never,
                {
                } as never,
                installer as never)

                await command.run(["pair-1"],
                    {
                        installService: true,
                        server: "https://api.example///",
                    })

                expect(installer.install).toHaveBeenCalledWith(
                    "pair-1",
                    "https://api.example",
                )
                expect(installer.uninstall).not.toHaveBeenCalled()
            })

        it("reports missing pairing code before installing a service",
            async () => {
                const installer = {
                    install: jest.fn(),
                    uninstall: jest.fn(),
                }
                const command = new AgentCommand({
                    cliName: "agent",
                    packageName: "agent",
                } as never,
                {
                } as never,
                installer as never)
                const exit = jest.spyOn(process,
                    "exit").mockImplementation((() => {
                        throw new Error("exit")
                    }) as never)

                await expect(command.run([],
                    {
                        installService: true,
                    })).rejects.toThrow("exit")

                expect(installer.install).not.toHaveBeenCalled()
                expect(exit).toHaveBeenCalledWith(1)
                exit.mockRestore()
            })
    })
