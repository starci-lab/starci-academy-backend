import {
    Module 
} from "@nestjs/common"
import {
    AGENT_META,
    type AgentMeta,
} from "@modules/playground-agent-core/agent-meta"
import {
    AgentCommand,
} from "@modules/playground-agent-core/agent.command"
import {
    BaseAgentService,
} from "@modules/playground-agent-core/base-agent.service"
import {
    CommandProbeService,
} from "@modules/playground-agent-core/command-probe.service"
import {
    DeviceService,
} from "@modules/playground-agent-core/device.service"
import {
    ServiceInstallerService,
} from "@modules/playground-agent-core/service-installer.service"
import {
    DockerAgentService 
} from "./docker-agent.service"
import {
    DockerResourceService 
} from "./docker-resource.service"

/** Identity for the docker agent (unique service names so it can coexist with k8s/rag). */
const DOCKER_AGENT_META: AgentMeta = {
    cliName: "playground-docker-agent",
    packageName: "@starciacademy/playground-docker-agent",
    label: "playground-docker-agent",
    description: "StarCi Academy playground BYOM agent (Docker)",
    readyMessage: "ready — run the Docker steps in your terminal; this agent relays output + verifies containers/images/networks.",
    taskName: "StarCiPlaygroundDockerAgent",
    systemdUnit: "starci-playground-docker-agent.service",
    launchdLabel: "org.starci.playground-docker-agent",
}

@Module({
    providers: [
        {
            provide: AGENT_META, useValue: DOCKER_AGENT_META 
        },
        CommandProbeService,
        DeviceService,
        ServiceInstallerService,
        DockerResourceService,
        DockerAgentService,
        {
            provide: BaseAgentService, useExisting: DockerAgentService 
        },
        AgentCommand,
    ],
})
/** Root module for the docker agent's nest-commander CLI. Unique systemd/launchd names so it can coexist with k8s/rag on the same machine. */
export class AppModule {}
