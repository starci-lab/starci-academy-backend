import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    Cron,
} from "@nestjs/schedule"
import {
    WinstonService,
} from "@modules/winston"
import {
    AbstractModelRouterService,
} from "./classes"
import {
    AiPingService,
} from "./ping"
import {
    AiTaskKind,
} from "./types"
/**
 * Model router for task generation.
 *
 * Picks the most cost-effective model based on the
 * `AI_MODEL_RECOMMENDATION` env tier and provider availability.
 */
@Injectable()
export class GenerateTaskModelRouterService
    extends AbstractModelRouterService
    implements OnModuleInit {

    protected readonly taskKind = AiTaskKind.GenerateMilestone

    constructor(
        winstonService: WinstonService,
        aiPingService: AiPingService,
    ) {
        super(
            winstonService,
            aiPingService,
        )
    }
    
    /**
     * On module init, check the quota of the model.
     * @returns A promise that resolves when the module is initialized.
     */
    async onModuleInit(): Promise<void> {
        await this.checkQuota()
    }

    /**
     * Proactive cron re-check — every 5 minutes, ping all providers
     * and re-resolve to the best available model.
     */
    @Cron("*/5 * * * *")
    async onCronRecheck(): Promise<void> {
        await this.checkQuota()
    }
}