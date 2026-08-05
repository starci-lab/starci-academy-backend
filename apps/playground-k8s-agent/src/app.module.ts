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
    K8sAgentService 
} from "./k8s-agent.service"
import {
    K8sResourceService 
} from "./k8s-resource.service"

/** Identity for the k8s agent (unique service names so it can coexist with docker/rag). */
const K8S_AGENT_META: AgentMeta = {
    cliName: "playground-k8s-agent",
    packageName: "@starciacademy/playground-k8s-agent",
    label: "playground-k8s-agent",
    description: "StarCi Academy playground BYOM agent (Kubernetes)",
    readyMessage: "ready — run the kubectl steps in your terminal; this agent relays output + verifies pods/deployments/services/…",
    taskName: "StarCiPlaygroundK8sAgent",
    systemdUnit: "starci-playground-k8s-agent.service",
    launchdLabel: "org.starci.playground-k8s-agent",
}

@Module({
    providers: [
        {
            provide: AGENT_META, useValue: K8S_AGENT_META 
        },
        CommandProbeService,
        DeviceService,
        ServiceInstallerService,
        K8sResourceService,
        K8sAgentService,
        {
            provide: BaseAgentService, useExisting: K8sAgentService 
        },
        AgentCommand,
    ],
})
/** Root module for the k8s agent's nest-commander CLI. Unique systemd/launchd names so it can coexist with docker/rag on the same machine. */
export class AppModule {}
