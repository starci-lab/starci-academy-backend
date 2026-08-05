import {
    Inject, Injectable 
} from "@nestjs/common"
import {
    AGENT_META,
    type AgentMeta,
} from "@modules/playground-agent-core/agent-meta"
import {
    BaseAgentService,
} from "@modules/playground-agent-core/base-agent.service"
import {
    EVENT,
    RESOURCE_INTERVAL_MS,
} from "@modules/playground-agent-core/constants"
import {
    DeviceService,
} from "@modules/playground-agent-core/device.service"
import {
    K8sResourceService 
} from "./k8s-resource.service"

@Injectable()
/** The Kubernetes capability: reports pods / deployments / services / ... for step verification. A failed snapshot is swallowed so it never tears down the command relay. */
export class K8sAgentService extends BaseAgentService {
    private resourceTimer?: NodeJS.Timeout

    constructor(
        @Inject(AGENT_META) meta: AgentMeta,
            deviceService: DeviceService,
        private readonly resources: K8sResourceService,
    ) {
        super(meta,
            deviceService)
    }

    /** Snapshot local Kubernetes resources and report them for step verification. */
    private report(): void {
        void this.resources.snapshot()
            .then((resources) => this.socket.emit(EVENT.resourcesReport,
                {
                    resources 
                }))
            .catch(() => { /* best-effort -- a failed snapshot never tears down the relay. */ })
    }

    protected onSetup(): void {
        this.socket.on(EVENT.stepVerified,
            () => this.report())
        this.socket.on(EVENT.verifyNow,
            () => this.report())
    }

    protected onPaired(): void {
        this.report()
        if (!this.resourceTimer) {
            this.resourceTimer = setInterval(() => this.report(),
                RESOURCE_INTERVAL_MS)
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
