jest.mock("node:child_process",
    () => ({
        spawnSync: jest.fn(),
    }))
jest.mock("node:fs",
    () => ({
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        rmSync: jest.fn(),
        writeFileSync: jest.fn(),
    }))

import {
    ServiceInstallerService
} from "./service-installer.service"
import {
    spawnSync
} from "node:child_process"
import {
    existsSync,
    mkdirSync,
    rmSync,
    writeFileSync,
} from "node:fs"
import type {
    AgentMeta
} from "./agent-meta"
import type {
    ServiceInput
} from "./types"

const meta: AgentMeta = {
    cliName: "playground-agent", packageName: "@starci/playground-agent", label: "agent",
    description: "Agent <relay> & safe", readyMessage: "ready", taskName: "StarCi Agent",
    systemdUnit: "starci-agent.service", launchdLabel: "org.starci.agent",
}

const input = (platform: NodeJS.Platform): ServiceInput => ({
    platform, nodePath: "C:\\Program Files\\node.exe", scriptPath: "C:\\agent main.js",
    pairingCode: "PAIR&<1>", server: "https://server.test", home: "/home/user", temp: "/tmp",
})

describe("ServiceInstallerService",
    () => {
        it.each(["win32",
            "linux",
            "darwin"] as const)("builds a safe %s service definition",
            (platform) => {
                const definition = new ServiceInstallerService(meta).buildServiceDefinition(input(platform))
                expect(definition.platform).toBe(platform)
                if (platform === "win32") {
                    expect(definition.manifest.content).toContain("PAIR&amp;&lt;1&gt;")
                }
                expect(definition.installCommands.length).toBeGreaterThan(0)
                expect(definition.uninstallCommands.length).toBeGreaterThan(0)
                expect(definition.removeOnUninstall).toHaveLength(1)
            })

        it("rejects unsupported platforms before attempting installation",
            () => {
                expect(() => new ServiceInstallerService(meta).buildServiceDefinition(input("freebsd" as NodeJS.Platform))).toThrow("Unsupported platform")
            })

        it("installs a resolved service definition and executes each command",
            () => {
                jest.mocked(spawnSync).mockReturnValue({
                    status: 0,
                    error: undefined,
                } as never)
                const service = new ServiceInstallerService(meta)

                service.install("PAIR",
                    "https://server.test")

                expect(mkdirSync).toHaveBeenCalled()
                expect(writeFileSync).toHaveBeenCalledWith(expect.any(String),
                    expect.any(String),
                    "utf8")
                expect(spawnSync).toHaveBeenCalled()
            })

        it("stops installation after a required command fails",
            () => {
                jest.mocked(spawnSync).mockReturnValue({
                    status: 1,
                    error: undefined,
                } as never)
                const exit = jest.spyOn(process,
                    "exit").mockImplementation((() => undefined) as never)
                const service = new ServiceInstallerService(meta)

                service.install("PAIR",
                    "https://server.test")

                expect(exit).toHaveBeenCalledWith(1)
                exit.mockRestore()
            })

        it("treats optional command failures as non-fatal and exposes command statuses",
            () => {
                const service = new ServiceInstallerService(meta)
                const runServiceCommand = service as unknown as {
                runServiceCommand: (command: { file: string; args: Array<string> }, optional: boolean) => boolean
            }
                const command = {
                    file: "systemctl",
                    args: ["--user",
                        "status"],
                }
                jest.mocked(spawnSync).mockReturnValueOnce({
                    status: 1,
                    error: undefined,
                } as never)
                expect(runServiceCommand.runServiceCommand(command,
                    false)).toBe(false)
                jest.mocked(spawnSync).mockReturnValueOnce({
                    status: 1,
                    error: undefined,
                } as never)
                expect(runServiceCommand.runServiceCommand(command,
                    true)).toBe(true)
                jest.mocked(spawnSync).mockReturnValueOnce({
                    status: null,
                    error: new Error("missing command"),
                } as never)
                expect(runServiceCommand.runServiceCommand(command,
                    false)).toBe(false)
                jest.mocked(spawnSync).mockReturnValueOnce({
                    status: 0,
                    error: undefined,
                } as never)
                expect(runServiceCommand.runServiceCommand(command,
                    false)).toBe(true)
            })

        it("uninstalls best-effort and logs manifest removal errors",
            () => {
                jest.mocked(spawnSync).mockReturnValue({
                    status: 1,
                    error: new Error("not installed"),
                } as never)
                jest.mocked(existsSync).mockReturnValueOnce(true)
                jest.mocked(rmSync).mockImplementationOnce(() => {
                    throw new Error("locked")
                })
                const service = new ServiceInstallerService(meta)

                expect(() => service.uninstall()).not.toThrow()
                expect(existsSync).toHaveBeenCalled()
                expect(rmSync).toHaveBeenCalled()
            })

        it("escapes XML-sensitive pairing metadata in the Windows definition",
            () => {
                const service = new ServiceInstallerService(meta)
                const definition = service.buildServiceDefinition({
                    ...input("win32"),
                    pairingCode: "A&B<1",
                    server: "https://server.test/?x=\"y\"",
                })
                expect(definition.manifest.content).toContain("A&amp;B&lt;1")
                expect(definition.manifest.content).toContain("&quot;y&quot;")
            })
    })
