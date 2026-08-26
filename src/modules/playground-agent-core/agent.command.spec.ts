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
    })
