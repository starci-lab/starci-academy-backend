/* eslint-disable starci-be/no-nest-logger --
 * Standalone playground agent CLI installer: Nest Logger is the operator-facing
 * console (install/uninstall). This process does not mount WinstonModule.
 */
import {
    Inject, Injectable, Logger,
} from "@nestjs/common"
import {
    spawnSync 
} from "node:child_process"
import {
    existsSync, mkdirSync, rmSync, writeFileSync 
} from "node:fs"
import {
    homedir, tmpdir 
} from "node:os"
import {
    dirname, join 
} from "node:path"
import {
    PlaygroundAgentUnsupportedPlatformException,
} from "@modules/platform/exceptions/errors/playground-agent/unsupported-platform"
import {
    AGENT_META, type AgentMeta 
} from "./agent-meta"
import type {
    ServiceCommand, ServiceDefinition, ServiceInput 
} from "./types"

@Injectable()
/**
 * Opt-in service mode: install the agent (baked to ONE pairing code) as an
 * OS-managed background service -- Task Scheduler (win), systemd user unit
 * (linux), launchd agent (mac). No native deps; the OS supervisor owns restart.
 * Names come from {@link AgentMeta} so the docker / k8s / rag agents can each
 * install their own service without colliding.
 */
export class ServiceInstallerService {
    private readonly logger: Logger

    constructor(@Inject(AGENT_META) private readonly meta: AgentMeta) {
        this.logger = new Logger(meta.label)
    }

    /** Escape the five XML entities so paths/args stay well-formed. */
    private escapeXml(value: string): string {
        return value
            .replace(/&/g,
                "&amp;")
            .replace(/</g,
                "&lt;")
            .replace(/>/g,
                "&gt;")
            .replace(/"/g,
                "&quot;")
            .replace(/'/g,
                "&apos;")
    }

    /** The agent argv the service must launch: `<code> --server <url>`. */
    private agentArgs(input: ServiceInput): Array<string> {
        return [input.pairingCode,
            "--server",
            input.server]
    }

    private buildWindowsDefinition(input: ServiceInput): ServiceDefinition {
        const command = `"${input.nodePath}"`
        const scriptAndArgs = [input.scriptPath,
            ...this.agentArgs(input)]
            .map((arg) => (arg.includes(" ") ? `"${arg}"` : arg)).join(" ")
        const xmlPath = join(input.temp,
            `${this.meta.cliName}.task.xml`)
        const xml = [
            "<?xml version=\"1.0\" encoding=\"UTF-16\"?>",
            "<Task version=\"1.2\" xmlns=\"http://schemas.microsoft.com/windows/2004/02/mit/task\">",
            `  <RegistrationInfo><Description>${this.escapeXml(this.meta.description)}</Description></RegistrationInfo>`,
            "  <Triggers><LogonTrigger><Enabled>true</Enabled></LogonTrigger></Triggers>",
            "  <Principals><Principal id=\"Author\"><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>",
            "  <Settings>",
            "    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>",
            "    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>",
            "    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>",
            "    <StartWhenAvailable>true</StartWhenAvailable>",
            "    <RestartOnFailure><Interval>PT1M</Interval><Count>999</Count></RestartOnFailure>",
            "    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>",
            "    <Enabled>true</Enabled>",
            "  </Settings>",
            `  <Actions Context="Author"><Exec><Command>${this.escapeXml(command)}</Command><Arguments>${this.escapeXml(scriptAndArgs)}</Arguments></Exec></Actions>`,
            "</Task>",
        ].join("\n")
        return {
            platform: input.platform,
            label: "Windows Scheduled Task",
            manifest: {
                path: xmlPath, content: xml 
            },
            installCommands: [
                {
                    file: "schtasks", args: ["/create",
                        "/tn",
                        this.meta.taskName,
                        "/xml",
                        xmlPath,
                        "/f"] 
                },
                {
                    file: "schtasks", args: ["/run",
                        "/tn",
                        this.meta.taskName] 
                },
            ],
            uninstallCommands: [
                {
                    file: "schtasks", args: ["/end",
                        "/tn",
                        this.meta.taskName] 
                },
                {
                    file: "schtasks", args: ["/delete",
                        "/tn",
                        this.meta.taskName,
                        "/f"] 
                },
            ],
            removeOnUninstall: [xmlPath],
            notes: [
                `Scheduled Task "${this.meta.taskName}" created: runs at logon and restarts on failure (every 1 min).`,
                `Inspect it:   schtasks /query /tn ${this.meta.taskName} /v /fo LIST`,
                `Uninstall:    ${this.meta.cliName} --uninstall-service`,
            ],
        }
    }

    private buildSystemdDefinition(input: ServiceInput): ServiceDefinition {
        const unitPath = join(input.home,
            ".config",
            "systemd",
            "user",
            this.meta.systemdUnit)
        const execStart = [input.nodePath,
            input.scriptPath,
            ...this.agentArgs(input)]
            .map((token) => (token.includes(" ") ? `"${token}"` : token)).join(" ")
        const unit = [
            "[Unit]",
            `Description=${this.meta.description}`,
            "After=network-online.target",
            "Wants=network-online.target",
            "",
            "[Service]",
            "Type=simple",
            `ExecStart=${execStart}`,
            "Restart=always",
            "RestartSec=3",
            "",
            "[Install]",
            "WantedBy=default.target",
            "",
        ].join("\n")
        return {
            platform: input.platform,
            label: "systemd user unit",
            manifest: {
                path: unitPath, content: unit 
            },
            installCommands: [
                {
                    file: "systemctl", args: ["--user",
                        "daemon-reload"] 
                },
                {
                    file: "systemctl", args: ["--user",
                        "enable",
                        "--now",
                        this.meta.systemdUnit] 
                },
            ],
            uninstallCommands: [
                {
                    file: "systemctl", args: ["--user",
                        "disable",
                        "--now",
                        this.meta.systemdUnit] 
                },
                {
                    file: "systemctl", args: ["--user",
                        "daemon-reload"] 
                },
            ],
            removeOnUninstall: [unitPath],
            notes: [
                `systemd user unit "${this.meta.systemdUnit}" enabled: starts now + on login, restarts on exit.`,
                "Note: stops on logout unless lingering is on — enable with:  loginctl enable-linger $USER",
                `Inspect it:   systemctl --user status ${this.meta.systemdUnit}`,
                `Logs:         journalctl --user -u ${this.meta.systemdUnit} -f`,
                `Uninstall:    ${this.meta.cliName} --uninstall-service`,
            ],
        }
    }

    private buildLaunchdDefinition(input: ServiceInput): ServiceDefinition {
        const plistPath = join(input.home,
            "Library",
            "LaunchAgents",
            `${this.meta.launchdLabel}.plist`)
        const programArgs = [input.nodePath,
            input.scriptPath,
            ...this.agentArgs(input)]
            .map((arg) => `      <string>${this.escapeXml(arg)}</string>`).join("\n")
        const plist = [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
            "<plist version=\"1.0\">",
            "  <dict>",
            `    <key>Label</key><string>${this.meta.launchdLabel}</string>`,
            "    <key>ProgramArguments</key>",
            "    <array>",
            programArgs,
            "    </array>",
            "    <key>RunAtLoad</key><true/>",
            "    <key>KeepAlive</key><true/>",
            "  </dict>",
            "</plist>",
            "",
        ].join("\n")
        return {
            platform: input.platform,
            label: "launchd user agent",
            manifest: {
                path: plistPath, content: plist 
            },
            installCommands: [
                {
                    file: "launchctl", args: ["unload",
                        plistPath] 
                },
                {
                    file: "launchctl", args: ["load",
                        "-w",
                        plistPath] 
                },
            ],
            uninstallCommands: [
                {
                    file: "launchctl", args: ["unload",
                        "-w",
                        plistPath] 
                },
            ],
            removeOnUninstall: [plistPath],
            notes: [
                `launchd agent "${this.meta.launchdLabel}" loaded: starts at login, restarts on exit.`,
                `Inspect it:   launchctl list | grep ${this.meta.launchdLabel}`,
                `Uninstall:    ${this.meta.cliName} --uninstall-service`,
            ],
        }
    }

    /** Build the platform service definition as pure data (printable / unit-testable). */
    buildServiceDefinition(input: ServiceInput): ServiceDefinition {
        switch (input.platform) {
        case "win32":
            return this.buildWindowsDefinition(input)
        case "linux":
            return this.buildSystemdDefinition(input)
        case "darwin":
            return this.buildLaunchdDefinition(input)
        default:
            throw new PlaygroundAgentUnsupportedPlatformException({
                platform: input.platform,
            })
        }
    }

    /** Resolve the runtime inputs (node path, dist entry, home, temp) for the current process. */
    private resolveInput(pairingCode: string, server: string): ServiceInput {
        return {
            platform: process.platform,
            nodePath: process.execPath,
            // the invoked bin script (its main.js) -- robust across the webpack dist layout.
            scriptPath: process.argv[1] ?? join(__dirname,
                "main.js"),
            pairingCode,
            server,
            home: homedir(),
            temp: tmpdir(),
        }
    }

    /** Run one command synchronously; return true on exit 0. `optional` swallows failures. */
    private runServiceCommand(command: ServiceCommand, optional: boolean): boolean {
        this.logger.log(`> ${command.file} ${command.args.join(" ")}`)
        const result = spawnSync(command.file,
            command.args,
            {
                stdio: "inherit", windowsHide: true 
            })
        if (result.error) {
            if (!optional) {
                this.logger.error(`command failed: ${result.error.message}`)
            }
            return false
        }
        if (result.status !== 0 && !optional) {
            this.logger.error(`command exited with status ${result.status ?? "unknown"}.`)
            return false
        }
        return true
    }

    private printSecurityWarning(): void {
        this.logger.warn("a background service runs the browser-driven command relay unattended.")
        this.logger.warn("It executes shell commands issued by the ONE paired playground session (per-session code).")
        this.logger.warn("Only install this on a machine you trust, for a session you started. Uninstall with --uninstall-service.")
    }

    /** Install the agent as an OS-managed background service, baked to `pairingCode`. */
    install(pairingCode: string, server: string): void {
        const input = this.resolveInput(pairingCode,
            server)
        let definition: ServiceDefinition
        try {
            definition = this.buildServiceDefinition(input)
        } catch (error) {
            this.logger.error((error as Error).message)
            process.exit(1)
            return
        }
        this.printSecurityWarning()
        this.logger.log(`installing as ${definition.label} (pairing code baked in) …`)
        this.logger.log(`manifest: ${definition.manifest.path}`)
        mkdirSync(dirname(definition.manifest.path),
            {
                recursive: true 
            })
        writeFileSync(definition.manifest.path,
            definition.manifest.content,
            "utf8")
        for (const command of definition.installCommands) {
            const optional = definition.platform === "darwin" && command.args[0] === "unload"
            if (!this.runServiceCommand(command,
                optional) && !optional) {
                this.logger.error("install failed — see the command output above. Nothing left running.")
                process.exit(1)
                return
            }
        }
        this.logger.log("service installed.")
        for (const note of definition.notes) {
            this.logger.log(note)
        }
    }

    /** Uninstall the background service (deregister commands + manifest file). */
    uninstall(): void {
        const input = this.resolveInput("-",
            "-")
        let definition: ServiceDefinition
        try {
            definition = this.buildServiceDefinition(input)
        } catch (error) {
            this.logger.error((error as Error).message)
            process.exit(1)
            return
        }
        this.logger.log(`uninstalling ${definition.label} …`)
        for (const command of definition.uninstallCommands) {
            this.runServiceCommand(command,
                true)
        }
        for (const file of definition.removeOnUninstall) {
            try {
                if (existsSync(file)) {
                    rmSync(file)
                    this.logger.log(`removed ${file}`)
                }
            } catch (error) {
                this.logger.warn(`could not remove ${file}: ${(error as Error).message}`)
            }
        }
        this.logger.log("service uninstalled.")
    }
}
