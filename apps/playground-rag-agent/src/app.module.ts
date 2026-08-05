import { Module } from "@nestjs/common"
import { AGENT_META, type AgentMeta, AgentCommand, BaseAgentService, CommandProbeService, DeviceService, ServiceInstallerService } from "@modules/playground-agent-core"
import { RagAgentService } from "./rag-agent.service"
import { RagService } from "./rag.service"

/** Identity for the rag agent (unique service names so it can coexist with docker/k8s). */
const RAG_AGENT_META: AgentMeta = {
    cliName: "playground-rag-agent",
    packageName: "@starciacademy/playground-rag-agent",
    label: "playground-rag-agent",
    description: "StarCi Academy playground BYOM agent (on-device RAG via Ollama)",
    readyMessage: "ready — import code + ask; this agent runs RAG on your LOCAL Ollama (no cloud).",
    taskName: "StarCiPlaygroundRagAgent",
    systemdUnit: "starci-playground-rag-agent.service",
    launchdLabel: "org.starci.playground-rag-agent",
}

@Module({
    providers: [
        { provide: AGENT_META, useValue: RAG_AGENT_META },
        CommandProbeService,
        DeviceService,
        ServiceInstallerService,
        RagService,
        RagAgentService,
        { provide: BaseAgentService, useExisting: RagAgentService },
        AgentCommand,
    ],
})
/** Root module for the rag agent's nest-commander CLI. Unique systemd/launchd names so it can coexist with docker/k8s on the same machine. */
export class AppModule {}
