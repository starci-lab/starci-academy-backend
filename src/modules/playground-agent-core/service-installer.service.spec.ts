import {
    ServiceInstallerService 
} from "./service-installer.service"
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
    })
