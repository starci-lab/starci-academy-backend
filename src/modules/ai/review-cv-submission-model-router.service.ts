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
} from "./ping.service"
import {
    AiTaskKind,
} from "./types"

/**
 * Model router for the CV submission review worker (`review-cv-submission` analyze step).
 *
 * Uses {@link modelTierMatrix}[{@link AiTaskKind.ReviewCvSubmission}] and
 * `AI_MODEL_RECOMMENDATION`; job payload may still override via `analyzeModel` / `analyzeProvider`.
 */
@Injectable()
export class ReviewCvSubmissionModelRouterService
    extends AbstractModelRouterService
    implements OnModuleInit {

    protected readonly taskKind = AiTaskKind.ReviewCvSubmission

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
