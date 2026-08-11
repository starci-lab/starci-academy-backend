import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import type {
    ConsumeEntitlementParams,
} from "@modules/ai/types/ai-entitlement"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"

@Injectable()
/**
 * Runs the canonical AI debit on the transaction manager owned by the personal-project
 * complete step. `AiEntitlementService.consume` opens a nested transaction; TypeORM uses
 * a savepoint when the supplied manager already owns a query runner, so attempt, ledger,
 * quota counters, rewards and job advancement share one outer commit.
 *
 * This adapter exists because using the application-scoped entitlement service here would
 * open an independent transaction and recreate the fatal attempt-commit-before-debit gap.
 */
export class ReviewMilestoneTaskCreditService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiAutoQuotaConfigService: AiAutoQuotaConfigService,
        private readonly dayjsService: DayjsService,
    ) {}

    /** Debit through the canonical service while participating in the caller's transaction. */
    async consume(
        entityManager: EntityManager,
        params: ConsumeEntitlementParams,
    ): Promise<void> {
        const transactionalEntitlement = new AiEntitlementService(
            entityManager,
            this.mountFilesystemService,
            this.aiAutoQuotaConfigService,
            this.dayjsService,
        )
        await transactionalEntitlement.consume(params)
    }
}
