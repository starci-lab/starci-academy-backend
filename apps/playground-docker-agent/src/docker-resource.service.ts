import { Injectable } from "@nestjs/common"
import { CommandProbeService, type PlaygroundResource } from "@modules/playground-agent-core"

/**
 * Snapshots local Docker resources (containers / images / networks) the way the
 * StarCi gateway's "lite" verify expects them. Missing tooling contributes
 * nothing (no throw) — a machine without Docker simply reports an empty list.
 */
@Injectable()
export class DockerResourceService {
    constructor(private readonly probe: CommandProbeService) {}

    /** Title-case a docker state token (`running` → `Running`) to match the expected status. */
    private titleCase(value: string): string {
        return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value
    }

    /** Best-effort snapshot of local Docker resources. Empty if Docker is absent. */
    async snapshot(): Promise<Array<PlaygroundResource>> {
        const out: Array<PlaygroundResource> = []
        for (const line of this.probe.lines(await this.probe.run("docker", ["ps", "-a", "--format", "{{.Names}}\t{{.State}}"]))) {
            const [name, state] = line.split("\t")
            if (name) {
                out.push({ kind: "Container", name, status: this.titleCase(state ?? "") })
            }
        }
        for (const name of this.probe.lines(await this.probe.run("docker", ["images", "--format", "{{.Repository}}:{{.Tag}}"]))) {
            if (name && !name.startsWith("<none>")) {
                out.push({ kind: "Image", name, status: "Present" })
            }
        }
        for (const name of this.probe.lines(await this.probe.run("docker", ["network", "ls", "--format", "{{.Name}}"]))) {
            out.push({ kind: "Network", name, status: "Present" })
        }
        return out
    }
}
