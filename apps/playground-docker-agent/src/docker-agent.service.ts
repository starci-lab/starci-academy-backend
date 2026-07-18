import { Inject, Injectable } from "@nestjs/common"
import { AGENT_META, type AgentMeta, BaseAgentService, DeviceService, EVENT, RESOURCE_INTERVAL_MS } from "@modules/playground-agent-core"
import { DockerResourceService } from "./docker-resource.service"

/** The docker capability: reports containers / images / networks for step verification. */
@Injectable()
export class DockerAgentService extends BaseAgentService {
    private resourceTimer?: NodeJS.Timeout

    constructor(
        @Inject(AGENT_META) meta: AgentMeta,
        deviceService: DeviceService,
        private readonly resources: DockerResourceService,
    ) {
        super(meta, deviceService)
    }

    /** Snapshot local Docker resources and report them for step verification. */
    private report(): void {
        void this.resources.snapshot()
            .then((resources) => this.socket.emit(EVENT.resourcesReport, { resources }))
            .catch(() => { /* best-effort — a failed snapshot never tears down the relay. */ })
    }

    protected onSetup(): void {
        this.socket.on(EVENT.stepVerified, () => this.report())
        this.socket.on(EVENT.verifyNow, () => this.report())
    }

    protected onPaired(): void {
        this.report()
        if (!this.resourceTimer) {
            this.resourceTimer = setInterval(() => this.report(), RESOURCE_INTERVAL_MS)
        }
    }

    protected afterCommand(): void {
        this.report()
    }

    protected onShutdown(): void {
        if (this.resourceTimer) {
            clearInterval(this.resourceTimer)
        }
    }
}
