import { Injectable } from "@nestjs/common"
import { CommandProbeService, type PlaygroundResource } from "@modules/playground-agent-core"

@Injectable()
/**
 * Snapshots local Kubernetes resources across the kinds StarCi steps verify.
 * Missing tooling / no cluster contributes nothing (no throw) — the agent still
 * runs and simply reports an empty list until a cluster is reachable.
 */
export class K8sResourceService {
    constructor(private readonly probe: CommandProbeService) {}

    /** One `kubectl get <kind> -A --no-headers` sweep → resources of `kind`. */
    private async kubectlList(
        resource: string,
        kind: string,
        statusOf: (columns: Array<string>) => string,
    ): Promise<Array<PlaygroundResource>> {
        const rows = this.probe.lines(await this.probe.run("kubectl", ["get", resource, "-A", "--no-headers"]))
        return rows.map((row) => {
            const columns = row.split(/\s+/)
            const clusterScoped = kind === "Node" || kind === "Namespace"
            const name = clusterScoped ? (columns[0] ?? "") : (columns[1] ?? "")
            return { kind, name, status: statusOf(columns) }
        }).filter((entry) => entry.name.length > 0)
    }

    /** Best-effort snapshot of local Kubernetes resources. Empty if kubectl/cluster is absent. */
    async snapshot(): Promise<Array<PlaygroundResource>> {
        const [pods, deployments, services, configmaps, secrets, jobs, nodes, namespaces] = await Promise.all([
            this.kubectlList("pods", "Pod", (columns) => columns[3] ?? ""),
            this.kubectlList("deployments", "Deployment", (columns) => {
                const [have, want] = (columns[2] ?? "").split("/")
                return have && want && have === want ? "Ready" : "NotReady"
            }),
            this.kubectlList("services", "Service", () => "Active"),
            this.kubectlList("configmaps", "ConfigMap", () => "Present"),
            this.kubectlList("secrets", "Secret", () => "Present"),
            this.kubectlList("jobs", "Job", (columns) => {
                const completions = columns.find((column) => /^\d+\/\d+$/.test(column)) ?? ""
                const [have, want] = completions.split("/")
                return have && want && have === want ? "Complete" : "Active"
            }),
            this.kubectlList("nodes", "Node", (columns) => columns[1] ?? ""),
            this.kubectlList("namespaces", "Namespace", (columns) => columns[1] ?? ""),
        ])
        return [...pods, ...deployments, ...services, ...configmaps, ...secrets, ...jobs, ...nodes, ...namespaces]
    }
}
