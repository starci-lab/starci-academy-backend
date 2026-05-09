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
} from "./abstract-model-router"
import {
    AiPingService,
} from "./ping.service"
import {
    AiTaskKind,
} from "./types"

/**
 * Model router for review personal project task jobs.
 *
 * Picks the most cost-effective model based on the
 * `AI_MODEL_RECOMMENDATION` env tier and provider availability.
 */
@Injectable()
export class ReviewPersonalProjectModelRouterService
    extends AbstractModelRouterService
    implements OnModuleInit {

    protected readonly taskKind = AiTaskKind.ReviewPersonalProject

    constructor(
        winstonService: WinstonService,
        aiPingService: AiPingService,
    ) {
        super(
            winstonService,
            aiPingService,
        )
    }

    async onModuleInit(): Promise<void> {
        await this.checkQuota()
    }

    @Cron("*/5 * * * *")
    async onCronRecheck(): Promise<void> {
        await this.checkQuota()
    }
}
