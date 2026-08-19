import {
    Inject 
} from "@nestjs/common"
import {
    Command, CommandRunner, Option 
} from "nest-commander"
import {
    AGENT_META, type AgentMeta 
} from "./agent-meta"
import {
    BaseAgentService 
} from "./base-agent.service"
import {
    DEFAULT_SERVER 
} from "./constants"
import {
    ServiceInstallerService 
} from "./service-installer.service"
import {
    envConfig,
} from "@modules/platform/env/config"

/** Parsed CLI options for {@link AgentCommand}. */
interface AgentCommandOptions {
    server?: string
    installService?: boolean
    uninstallService?: boolean
}

@Command({
    name: "playground-agent",
    arguments: "[pairingCode]",
    description: "Pair your local machine with a StarCi playground session, relay commands, and report resources + device info.",
    options: {
        isDefault: true 
    },
})
/**
 * The default CLI command (nest-commander) shared by all three agents. Forms:
 *   <agent> <pairingCode> [--server <url>]        -> run the relay
 *   <agent> <pairingCode> --install-service       -> install background service
 *   <agent> --uninstall-service                   -> remove background service
 *
 * `isDefault: true` means it runs directly (`<agent> <code>`, no subcommand) --
 * so the static `name` here is cosmetic; each app's binary name comes from its
 * generated package.json `bin`, and the exact usage/label come from the meta.
 */
export class AgentCommand extends CommandRunner {
    constructor(
        @Inject(AGENT_META) private readonly meta: AgentMeta,
        private readonly agentService: BaseAgentService,
        private readonly serviceInstaller: ServiceInstallerService,
    ) {
        super()
    }

    @Option({
        flags: "-s, --server <url>",
        description: "StarCi API origin (default: env STARCI_PLAYGROUND_SERVER or wss://api.academy.starci.org).",
    })
    parseServer(value: string): string {
        return value
    }

    @Option({
        flags: "--install-service",
        description: "Install a background service (auto-restart, starts on login) baked to the given pairing code.",
    })
    parseInstall(): boolean {
        return true
    }

    @Option({
        flags: "--uninstall-service",
        description: "Remove the background service.",
    })
    parseUninstall(): boolean {
        return true
    }

    async run(inputs: Array<string>, options: AgentCommandOptions): Promise<void> {
        const pairingCode = inputs[0]
        const rawServer = options.server || envConfig().playgroundAgent.server || DEFAULT_SERVER
        // strip trailing slashes without a backtracking-prone /\/+$/ regex
        let server = rawServer
        while (server.endsWith("/")) {
            server = server.slice(0,
                -1)
        }

        if (options.uninstallService) {
            this.serviceInstaller.uninstall()
            return
        }
        if (options.installService) {
            if (!pairingCode) {
                // CLI usage text, not application logging: this is a standalone npx binary
                // whose output channel IS the terminal. WinstonService ships structured
                // events to Loki -- it cannot tell the operator how to invoke the command.
                // eslint-disable-next-line no-console
                console.error(`--install-service needs a pairing code: ${this.meta.cliName} <pairingCode> --install-service`)
                process.exit(1)
            }
            this.serviceInstaller.install(pairingCode,
                server)
            return
        }
        if (!pairingCode) {
            // Same reason as above: usage text for a human at a terminal, not a log event.
            // eslint-disable-next-line no-console
            console.error(`Usage: npx ${this.meta.packageName} <pairingCode> [--server <url>]`)
            process.exit(1)
        }
        // RUN mode: wire up the relay, then keep the command pending forever -- the
        // socket keeps the process alive and nest-commander must NOT close the context.
        this.agentService.run(pairingCode,
            server)
        await new Promise<void>(() => { /* never resolves */ })
    }
}
