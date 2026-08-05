/** Public surface of the shared playground-agent core module -- imported by each agent app via @modules/playground-agent-core. */
export { AGENT_META, type AgentMeta } from "./agent-meta"
export { AgentCommand } from "./agent.command"
export { BaseAgentService } from "./base-agent.service"
export { CommandProbeService } from "./command-probe.service"
export { DEFAULT_SERVER, EVENT, NAMESPACE, RESOURCE_INTERVAL_MS } from "./constants"
export { DeviceService } from "./device.service"
export { ServiceInstallerService } from "./service-installer.service"
export type { DeviceInfo, PairAck, PlaygroundResource, ServiceCommand, ServiceDefinition, ServiceInput } from "./types"
