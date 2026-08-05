import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    AiCeilOverrides,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    AppConfigSubscriptionTier,
} from "@modules/filesystem/types/config"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    AiModeNotEntitledException,
} from "@modules/platform/exceptions/errors/ai/ai-mode-not-entitled"
import {
    AiQuotaExhaustedException,
} from "@modules/platform/exceptions/errors/ai/ai-quota-exhausted"
import {
    SUBSCRIPTION_PERIOD_MONTHS,
    TIER_ALLOWED_CATEGORIES,
    WINDOW_5H_MS,
    WINDOW_WEEK_MS,
} from "./constants/ai-entitlement.constants"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import type {
    AiEntitlement,
    AiQuotaSnapshot,
    AiSettings,
    ConsumeEntitlementParams,
    EntitlementHistoryPage,
    EntitlementHistoryParams,
    GrantBonusCreditParams,
    GrantBonusCreditResult,
    GrantTierParams,
    ResolveCeilParams,
    ResolveEntitlementParams,
    SetCeilParams,
} from "./types/ai-entitlement"

@Injectable()
/**
 * Resolves and debits a user's AI entitlement.
 *
 * Every run spends a single credit pool over two sliding-reset windows
 * (5h + 1 week):
 *
 * - **Allowance** = the free base credits (`systemConfig.ai.auto`, see
 *   {@link AiAutoQuotaConfigService}) + the active tier's catalog credits.
 * - **Model access** is gated by tier via {@link TIER_ALLOWED_CATEGORIES}. A
 *   call is billed by TOKENS actually used -- `AiModelCatalogService.creditForRun`
 *   applies the served model's own per-million-token rates -- not by a flat
 *   per-category constant.
 *
 * Windows reset lazily on read: when a `*ResetAt` timestamp is in the past the
 * matching counter drops to 0 and the timestamp rolls forward from "now".
 */
export class AiEntitlementService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiAutoQuotaConfigService: AiAutoQuotaConfigService,
        private readonly dayjsService: DayjsService,
    ) { }

    /**
     * Resolve the live entitlement for a user.
     *
     * Loads (or lazily creates) the user's {@link AiSubscriptionEntity}, applies
     * any due window resets, then derives allowed categories + remaining
     * allowances. Performed inside a transaction so a concurrent reset is safe.
     *
     * @param params - the owning `userId`
     * @returns the user's current {@link AiEntitlement}
     */
    async resolve({
        userId,
    }: ResolveEntitlementParams): Promise<AiEntitlement> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)
                await entityManager.save(subscription)
                return this.toEntitlement(subscription)
            },
        )
    }

    /**
     * Debit the unified credit pool after a successful run AND append the
     * audit-history row for it -- ONE atomic write, the single source for both
     * the quota counters and the AI usage history list. No other code
     * path may touch `credit5hUsed`/`creditWeekUsed` or write a
     * {@link CreditUsageHistoryEntity} row.
     *
     * Locks the subscription row `FOR UPDATE` so concurrent debits serialize
     * and never lose an update.
     *
     * @param params - Owner, lane, cost, and the attribution fields to record.
     */
    async consume({
        userId,
        cost,
        surface,
        model,
        provider,
        recommendation,
        task,
        promptTokens,
        completionTokens,
        attempts,
    }: ConsumeEntitlementParams): Promise<void> {
        await this.entityManager.transaction(
            async (entityManager) => {
                if (cost > 0) {
                    // lock the subscription row FOR UPDATE -- concurrent debits serialize
                    // here, so a read-modify-write race can never drop a debit (over-spend)
                    const subscription = await entityManager
                        .createQueryBuilder(
                            AiSubscriptionEntity,
                            "subscription",
                        )
                        .setLock("pessimistic_write")
                        .where(
                            "subscription.user_id = :userId",
                            {
                                userId,
                            },
                        )
                        .getOne()
                    if (subscription) {
                        // roll any due windows forward so the debit hits the live window
                        this.applyWindowResets(subscription)
                        // debit BOTH sliding windows by the grading cost under the held lock
                        subscription.credit5hUsed += cost
                        subscription.creditWeekUsed += cost
                        await entityManager.save(subscription)
                    }
                }
                // history row is written REGARDLESS of cost (even a free balancer pick
                // is worth an audit entry) -- same transaction as the debit above
                await entityManager.save(
                    CreditUsageHistoryEntity,
                    {
                        user: {
                            id: userId,
                        },
                        surface,
                        task: task ?? null,
                        recommendation: recommendation ?? null,
                        model: model ?? null,
                        provider: provider ?? null,
                        credits: cost,
                        promptTokens: promptTokens ?? null,
                        completionTokens: completionTokens ?? null,
                        attempts: attempts ?? null,
                    },
                )
            },
        )
    }

    /**
     * Paginated AI credit charge history for the user, newest first -- read
     * directly from `credit_usage_histories` (not cached; viewed on demand, not
     * on the grading hot path).
     *
     * @param params - Owner, page size, and offset.
     * @returns the requested page of {@link EntitlementHistoryItem}.
     */
    async history({
        userId,
        limit,
        offset,
    }: EntitlementHistoryParams): Promise<EntitlementHistoryPage> {
        const [
            rows,
            total,
        ] = await this.entityManager.findAndCount(
            CreditUsageHistoryEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                take: limit,
                skip: offset,
            },
        )
        return {
            items: rows.map((row) => ({
                id: row.id,
                recommendation: row.recommendation,
                model: row.model,
                provider: row.provider,
                credits: row.credits,
                createdAt: row.createdAt,
                surface: row.surface,
            })),
            total,
        }
    }

    /**
     * Full quota snapshot for the UI -- caps + used + remaining for BOTH the
     * free Auto lane and the paid Premium lane, plus the window reset times.
     *
     * Applies due window resets first (same lazy reset as {@link resolve}) so
     * the numbers reflect "now". Read-only from the caller's perspective.
     *
     * @param params - the owning `userId`
     * @returns the user's {@link AiQuotaSnapshot}
     */
    async snapshot({
        userId,
    }: ResolveEntitlementParams): Promise<AiQuotaSnapshot> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)
                await entityManager.save(subscription)
                const unlocked = await this.isUnlocked(
                    userId,
                    subscription,
                    entityManager,
                )
                return this.toSnapshot(subscription,
                    unlocked)
            },
        )
    }

    /**
     * Assert the user still has room in the UNIFIED credit pool (same source
     * as {@link snapshot}/{@link consume} -- tier-aware: a paid tier's own
     * allowance, or the free Auto base when unset). Grade-time gate for
     * surfaces that don't already gate at submit-time.
     *
     * Replaces the old free-base-only `CreditUsageService.getSnapshot(...)
     * .overQuota` check that several grade-step services used -- that read a
     * SEPARATE, tier-blind counter (`credit_usage_histories`) always compared
     * against the free 50/5h - 250/week base, so a paid Pro/Max user could
     * still get incorrectly blocked. This reads the same pool everyone else's
     * quota UI/gate reads.
     *
     * @param params - the owning `userId`
     * @throws AiQuotaExhaustedException when either sliding window is spent.
     */
    async assertNotOverQuota({
        userId,
    }: ResolveEntitlementParams): Promise<void> {
        const snapshot = await this.snapshot({
            userId,
        })
        if (snapshot.credit.remaining5h <= 0) {
            throw new AiQuotaExhaustedException({
                window: "5h",
            })
        }
        if (snapshot.credit.remainingWeek <= 0) {
            throw new AiQuotaExhaustedException({
                window: "week",
            })
        }
    }

    /**
     * Read the user's AI settings -- saved lane preference + the capabilities
     * the UI needs to decide which lanes are selectable.
     *
     * @param params - the owning `userId`
     * @returns the user's {@link AiSettings}
     */
    async getSettings({
        userId,
    }: ResolveEntitlementParams): Promise<AiSettings> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)
                await entityManager.save(subscription)
                const unlocked = await this.isUnlocked(
                    userId,
                    subscription,
                    entityManager,
                )
                return this.toSettings(subscription,
                    unlocked)
            },
        )
    }

    /**
     * Grant a paid tier on successful payment and mark the funding transaction
     * succeeded -- both inside one DB transaction. Atomic: the Pending->Succeeded
     * transition is claimed FIRST via a guarded `UPDATE ... WHERE status =
     * 'pending'` (same technique as
     * `TransactionActionService.updateTransactionStatusIfExpected`); the tier is
     * only granted when THIS call is the one that won that claim (rows-affected
     * = 1). A concurrent webhook/reconcile-poll race that loses the claim sees
     * 0 rows affected and no-ops -- so a paid transaction is granted exactly
     * once, not merely "checked then acted on".
     *
     * @param params - the owning `userId`, the `tier` to grant, and the
     *  `transactionId` that funded it
     */
    async grantTier({
        userId,
        tier,
        transactionId,
    }: GrantTierParams): Promise<boolean> {
        return this.entityManager.transaction(
            async (entityManager): Promise<boolean> => {
                // atomically claim the Pending -> Succeeded transition BEFORE
                // granting anything -- this IS the guard, replacing the earlier
                // read-then-compare-in-app-code (TOCTOU) idempotency check
                const claim = await entityManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                        status: TransactionStatus.Pending,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
                if (!claim.affected) {
                    // already claimed (granted) by a concurrent/earlier path -> not a new grant
                    return false
                }

                // this call alone won the claim -> activate the tier for a fresh
                // billing period; runs exactly once for this transaction
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                subscription.tier = tier
                subscription.status = AiSubStatus.Active
                subscription.currentPeriodEnd = this.dayjsService
                    .now()
                    .add(SUBSCRIPTION_PERIOD_MONTHS,
                        "month")
                    .toDate()
                subscription.autoRenew = false
                await entityManager.save(subscription)

                // a new grant happened -> caller may notify the buyer
                return true
            },
        )
    }

    /**
     * Resolve the model categories the user UNLOCKS (the ceiling), independent of
     * the requested lane. Drives the Auto difficulty-floor climb chain. Unlocked
     * (every category up to Frontier) when the user has paid a tier **OR** is
     * enrolled in any course; otherwise the `free` allowance ([free, economy]).
     *
     * @param params - the owning `userId`.
     * @returns the unlocked categories (ceiling).
     */
    async resolveTierCategories(
        {
            userId,
        }: ResolveEntitlementParams,
    ): Promise<Array<AiModelCategory>> {
        const subscription = await this.entityManager.findOne(
            AiSubscriptionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        const unlocked = await this.isUnlocked(userId,
            subscription)
        return unlocked
            ? TIER_ALLOWED_CATEGORIES[AiSubTier.Plus]
            : TIER_ALLOWED_CATEGORIES.free
    }

    /**
     * Whether the user may use the higher (paid) model tiers -- true when they
     * have an active paid subscription **OR** are enrolled in any course. This is
     * the StarCi "enroll OR pay unlocks higher tiers" rule: an enrolled learner
     * gets the same model access as a paid AI subscriber (credit allowance still
     * follows the actual tier -- enrolled-not-paid spends the free base pool).
     *
     * @param userId - the owning user.
     * @param subscription - the user's subscription row (or null).
     * @param entityManager - optional manager to run inside a transaction.
     * @returns true when paid or enrolled.
     */
    private async isUnlocked(
        userId: string,
        subscription: AiSubscriptionEntity | null,
        entityManager?: EntityManager,
    ): Promise<boolean> {
        if (subscription && this.isPremiumActive(subscription)) {
            return true
        }
        return this.hasActiveEnrollment(userId,
            entityManager)
    }

    /**
     * Public wrapper around {@link hasActiveEnrollment} for gates OUTSIDE this
     * service that need the raw "has an active enrollment" check without
     * duplicating the query (e.g. the Playground `createPlaygroundSession`
     * mutation gate).
     *
     * @param userId - the owning user.
     * @param entityManager - optional manager (to share a transaction).
     * @returns true when an active enrollment exists.
     */
    async hasAnyActiveEnrollment(
        userId: string,
        entityManager?: EntityManager,
    ): Promise<boolean> {
        return this.hasActiveEnrollment(userId,
            entityManager)
    }

    /**
     * Whether the user has at least one active enrollment (`is_enrolled = true`).
     *
     * @param userId - the owning user.
     * @param entityManager - optional manager (to share a transaction).
     * @returns true when an active enrollment exists.
     */
    private async hasActiveEnrollment(
        userId: string,
        entityManager?: EntityManager,
    ): Promise<boolean> {
        const manager = entityManager ?? this.entityManager
        const count = await manager.count(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    isEnrolled: true,
                },
            },
        )
        return count > 0
    }

    /**
     * Assert the user may pick / grade with paid-tier models -- passes when paid
     * OR enrolled (the unlock rule), throws otherwise. Replaces a strict
     * `resolve({ requestedMode: Premium })` for the grading model-pick gate so an
     * enrolled learner can pin a higher model.
     *
     * @param params - the owning `userId`.
     * @throws AiModeNotEntitledException when neither paid nor enrolled.
     */
    async assertCanUsePaidModels(
        {
            userId,
        }: ResolveEntitlementParams,
    ): Promise<void> {
        const subscription = await this.entityManager.findOne(
            AiSubscriptionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        if (!(await this.isUnlocked(userId,
            subscription))) {
            throw new AiModeNotEntitledException({
                reason: "no active paid subscription or enrollment",
            })
        }
    }

    /**
     * Build the user-facing {@link AiSettings} view from a (post-reset) entity.
     *
     * `unlocked` (paid OR enrolled) drives `canPremium` -- the FE picker's unlock
     * for higher-tier models; an enrolled learner unlocks them too. `tier` is the
     * active paid tier (null when not paid).
     */
    private toSettings(
        subscription: AiSubscriptionEntity,
        unlocked = false,
    ): AiSettings {
        const canPremium = unlocked
        const tier = this.isPremiumActive(subscription)
            ? subscription.tier
            : null

        return {
            canPremium,
            tier,
        }
    }

    /**
     * Load the user's entitlement row, creating a default free one when absent.
     */
    private async loadOrCreate(
        userId: string,
        entityManager: EntityManager,
    ): Promise<AiSubscriptionEntity> {
        const existing = await entityManager.findOne(
            AiSubscriptionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        if (existing) {
            return existing
        }
        const now = this.dayjsService.now()
        const created = entityManager.create(
            AiSubscriptionEntity,
            {
                user: {
                    id: userId,
                },
                tier: null,
                status: AiSubStatus.Active,
                currentPeriodEnd: null,
                autoRenew: false,
                window5hResetAt: now.add(WINDOW_5H_MS,
                    "millisecond").toDate(),
                windowWeekResetAt: now.add(WINDOW_WEEK_MS,
                    "millisecond").toDate(),
                credit5hUsed: 0,
                creditWeekUsed: 0,
                bonusCredit5h: 0,
                bonusCreditWeek: 0,
            },
        )
        return entityManager.save(created)
    }

    /**
     * Reset a window's counters to 0 and roll its `resetAt` forward when the
     * window has elapsed (or was never initialised). Mutates `subscription`.
     *
     * A Coin-shop `aiCredit` top-up (`bonusCredit5h`/`bonusCreditWeek`) resets
     * to 0 in lockstep with its window -- it funds the CURRENT cycle only, it is
     * not a permanent allowance bump.
     */
    private applyWindowResets(subscription: AiSubscriptionEntity): void {
        const now = this.dayjsService.now()
        if (
            !subscription.window5hResetAt
            || now.isAfter(subscription.window5hResetAt)
        ) {
            subscription.credit5hUsed = 0
            subscription.bonusCredit5h = 0
            subscription.window5hResetAt = now
                .add(WINDOW_5H_MS,
                    "millisecond")
                .toDate()
        }
        if (
            !subscription.windowWeekResetAt
            || now.isAfter(subscription.windowWeekResetAt)
        ) {
            subscription.creditWeekUsed = 0
            subscription.bonusCreditWeek = 0
            subscription.windowWeekResetAt = now
                .add(WINDOW_WEEK_MS,
                    "millisecond")
                .toDate()
        }
    }

    /**
     * Grant Coin-shop `aiCredit` bonus credit to the user's CURRENT windows.
     * Rolls any due window reset forward FIRST (under a row lock) so the bonus
     * always lands in the live window, never one that is about to reset away.
     * Called by {@link RewardsService.redeem} when redeeming an `aiCredit`
     * reward -- never called from anywhere else (single writer of these two
     * columns besides the reset itself).
     *
     * @param params - owner + the bonus amounts to add to each window.
     * @returns the subscription's post-grant `bonusCredit5h`/`bonusCreditWeek`.
     */
    async grantBonusCredit(
        {
            userId,
            amount5h,
            amountWeek,
            entityManager,
        }: GrantBonusCreditParams,
    ): Promise<GrantBonusCreditResult> {
        const subscription = await entityManager
            .createQueryBuilder(
                AiSubscriptionEntity,
                "subscription",
            )
            .setLock("pessimistic_write")
            .where(
                "subscription.user_id = :userId",
                {
                    userId,
                },
            )
            .getOne()
            ?? await this.loadOrCreate(userId,
                entityManager)
        this.applyWindowResets(subscription)
        subscription.bonusCredit5h += amount5h
        subscription.bonusCreditWeek += amountWeek
        await entityManager.save(subscription)
        return {
            bonusCredit5h: subscription.bonusCredit5h,
            bonusCreditWeek: subscription.bonusCreditWeek,
        }
    }

    /**
     * Derive the {@link AiEntitlement} view from a (post-reset) entity: the
     * user's active tier (paid -> its tier, else free) drives allowed categories
     * + credit allowance.
     */
    private toEntitlement(
        subscription: AiSubscriptionEntity,
    ): AiEntitlement {
        const tier = this.isPremiumActive(subscription)
            ? subscription.tier
            : null
        const allowedCategories = TIER_ALLOWED_CATEGORIES[tier ?? "free"]
        const {
            limit5h,
            limitWeek,
        } = this.creditAllowance(tier)
        // Coin-shop aiCredit top-up: magnitude-only extension of THIS window's
        // budget, never a model-category unlock (that stays tier-gated above)
        const effectiveLimit5h = limit5h + subscription.bonusCredit5h
        const effectiveLimitWeek = limitWeek + subscription.bonusCreditWeek

        return {
            allowedCategories,
            creditRemaining5h: Math.max(
                0,
                effectiveLimit5h - subscription.credit5hUsed,
            ),
            creditRemainingWeek: Math.max(
                0,
                effectiveLimitWeek - subscription.creditWeekUsed,
            ),
        }
    }

    /**
     * The per-window credit allowance: a paid tier **OVERRIDES** the free base --
     * the tier catalog credits ARE the total (not added on top of the base). Free
     * (no tier) gets the base credits from `systemConfig.ai.auto`. Everyone spends
     * from this single pool; upgrading a tier replaces the cap, it does not stack.
     *
     * @param tier - active paid tier, or null for free.
     * @returns the 5h + weekly credit limits.
     */
    private creditAllowance(
        tier: AiSubTier | null,
    ): { limit5h: number, limitWeek: number } {
        const tierConfig = tier ? this.findTierConfig(tier) : null
        // paid tier overrides the free base
        if (tierConfig) {
            return {
                limit5h: tierConfig.creditsPer5h,
                limitWeek: tierConfig.creditsPerWeek,
            }
        }
        const base = this.aiAutoQuotaConfigService.getAutoQuota()
        return {
            limit5h: base.creditsPer5h,
            limitWeek: base.creditsPerWeek,
        }
    }

    /**
     * Build the full {@link AiQuotaSnapshot} from a (post-reset) entity -- both
     * lanes, with caps from constants (Auto) and the tier catalog (Premium).
     */
    private toSnapshot(
        subscription: AiSubscriptionEntity,
        unlocked = false,
    ): AiQuotaSnapshot {
        const tier = this.isPremiumActive(subscription)
            ? subscription.tier
            : null
        const {
            limit5h,
            limitWeek,
        } = this.creditAllowance(tier)
        // Coin-shop aiCredit top-up: magnitude-only extension of THIS window's
        // budget, folded into the shown limit (never a category unlock)
        const effectiveLimit5h = limit5h + subscription.bonusCredit5h
        const effectiveLimitWeek = limitWeek + subscription.bonusCreditWeek

        const overrides = subscription.ceilOverrides
        return {
            tier,
            credit: {
                limit5h: effectiveLimit5h,
                used5h: subscription.credit5hUsed,
                remaining5h: Math.max(
                    0,
                    effectiveLimit5h - subscription.credit5hUsed,
                ),
                limitWeek: effectiveLimitWeek,
                usedWeek: subscription.creditWeekUsed,
                remainingWeek: Math.max(
                    0,
                    effectiveLimitWeek - subscription.creditWeekUsed,
                ),
            },
            window5hResetAt: subscription.window5hResetAt,
            windowWeekResetAt: subscription.windowWeekResetAt,
            // ceiling the user caps within -- unlocked (paid OR enrolled) -> all
            allowedCategories: unlocked
                ? TIER_ALLOWED_CATEGORIES[AiSubTier.Plus]
                : TIER_ALLOWED_CATEGORIES.free,
            // per-surface ceiling the user set (null each = inherit default / no cap)
            ceil: {
                default: overrides?.default ?? null,
                chatbot: overrides?.chatbot ?? null,
                grading: overrides?.grading ?? null,
                interview: overrides?.interview ?? null,
            },
        }
    }

    /**
     * Resolve the model CEILING for one surface from the user's saved overrides:
     * the surface override if set, else the global `default`, else null (no cap ->
     * the plan ceiling alone limits the climb). Read-only, no row creation.
     *
     * @param params - the owning `userId` + the `surface` (omit -> just the default).
     * @returns the ceiling category, or null when uncapped.
     */
    async resolveCeil(
        {
            userId,
            surface,
        }: ResolveCeilParams,
    ): Promise<AiModelCategory | null> {
        const subscription = await this.entityManager.findOne(
            AiSubscriptionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        const overrides = subscription?.ceilOverrides
        if (!overrides) {
            return null
        }
        return (surface ? overrides[surface] : undefined)
            ?? overrides.default
            ?? null
    }

    /**
     * Set (or clear) the user's model ceiling for one surface -- or the global
     * `default` when `surface` is omitted. A null `category` clears that key. The
     * overrides map is dropped to null when it becomes empty. Returns the refreshed
     * snapshot so the caller can echo the new state.
     *
     * @param params - owner, the surface (omit -> default), and the category (null -> clear).
     * @returns the user's refreshed {@link AiQuotaSnapshot}.
     */
    async setCeil(
        {
            userId,
            surface,
            category,
        }: SetCeilParams,
    ): Promise<AiQuotaSnapshot> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)
                const overrides: AiCeilOverrides = {
                    ...(subscription.ceilOverrides ?? {
                    }),
                }
                const key = surface ?? "default"
                if (category) {
                    overrides[key] = category
                } else {
                    delete overrides[key]
                }
                subscription.ceilOverrides = Object.keys(overrides).length > 0
                    ? overrides
                    : null
                await entityManager.save(subscription)
                return this.toSnapshot(subscription)
            },
        )
    }

    /**
     * Whether the paid Premium lane is currently usable: status `active` and
     * a tier set with a `currentPeriodEnd` in the future.
     */
    private isPremiumActive(
        subscription: AiSubscriptionEntity,
    ): boolean {
        if (
            !subscription.tier
            || subscription.status !== AiSubStatus.Active
            || !subscription.currentPeriodEnd
        ) {
            return false
        }
        return this.dayjsService.now().isBefore(subscription.currentPeriodEnd)
    }

    /**
     * Look up the live tier catalog entry from the mounted app config.
     */
    private findTierConfig(
        tier: AiSubTier,
    ): AppConfigSubscriptionTier | undefined {
        const {
            tiers,
        } = this.mountFilesystemService.appConfig().subscriptions
        return tiers.find((candidate) => candidate.tier === tier)
    }
}
