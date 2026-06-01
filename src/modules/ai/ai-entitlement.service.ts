import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    AiMode,
    AiSubStatus,
    AiSubscriptionEntity,
    AiSubTier,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    AppConfigSubscriptionTier,
    MountFilesystemService,
} from "@modules/filesystem"
import {
    DayjsService,
} from "@modules/mixin"
import {
    EncryptionService,
} from "@modules/crypto"
import {
    AiByokInvalidException,
    AiModeNotEntitledException,
} from "@modules/exceptions"
import {
    AUTO_LIMIT_5H,
    AUTO_LIMIT_WEEK,
    SUBSCRIPTION_PERIOD_MONTHS,
    TIER_ALLOWED_CATEGORIES,
    WINDOW_5H_MS,
    WINDOW_WEEK_MS,
} from "./constants"
import type {
    AiEntitlement,
    AiQuotaSnapshot,
    AiSettings,
    ConsumeEntitlementParams,
    GrantTierParams,
    ResolveEntitlementParams,
    UpdateAiSettingsParams,
} from "./types"

/**
 * Resolves and debits a user's AI entitlement.
 *
 * Two paid-vs-free lanes share two sliding-reset windows (5h + 1 week):
 *
 * - **Auto** (free, course-included): counted in "lượt" (uses). Capped at
 *   {@link AUTO_LIMIT_5H} per 5h AND {@link AUTO_LIMIT_WEEK} per week; only
 *   `economy` models allowed.
 * - **Premium** (active paid tier): credit-based. Per-window allowances come
 *   from the `subscriptions.tiers` catalog; each call costs
 *   {@link CATEGORY_CREDIT_COST} credits by category and the tier unlocks its
 *   category and below.
 * - **BYOK**: the user supplies their own key → no quota.
 *
 * Windows reset lazily on read: when a `*ResetAt` timestamp is in the past the
 * matching counters drop to 0 and the timestamp rolls forward from "now".
 */
@Injectable()
export class AiEntitlementService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly dayjsService: DayjsService,
        private readonly encryptionService: EncryptionService,
    ) { }

    /**
     * Resolve the live entitlement for a user.
     *
     * Loads (or lazily creates) the user's {@link AiSubscriptionEntity}, applies
     * any due window resets, then derives mode + allowed categories + remaining
     * allowances. Performed inside a transaction so a concurrent reset is safe.
     *
     * @param params - the owning `userId`
     * @returns the user's current {@link AiEntitlement}
     */
    async resolve({
        userId,
        requestedMode,
        ephemeralByok,
    }: ResolveEntitlementParams): Promise<AiEntitlement> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)
                await entityManager.save(subscription)
                return this.toEntitlement(
                    subscription,
                    requestedMode,
                    ephemeralByok,
                )
            },
        )
    }

    /**
     * Debit the Premium tier credit pool after a successful grading run.
     *
     * No-op for Auto (billed via `credit_usage_histories`) and Byok (free).
     * Locks the subscription row `FOR UPDATE` so concurrent debits serialize and
     * never lose an update — the tier counters always reflect true spend (so the
     * pool can't be over-spent across concurrent premium gradings).
     *
     * @param params - Owner, the lane that ran, and the credits to debit.
     */
    async consume({
        userId,
        mode,
        cost,
    }: ConsumeEntitlementParams): Promise<void> {
        // only Premium draws down the tier pool; Auto/Byok never touch it
        if (mode !== AiMode.Premium || cost <= 0) {
            return
        }
        await this.entityManager.transaction(
            async (entityManager) => {
                // lock the subscription row FOR UPDATE — concurrent debits serialize here,
                // so a read-modify-write race can never drop a debit (over-spend)
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
                // premium always has a row; nothing to debit otherwise
                if (!subscription) {
                    return
                }
                // roll any due windows forward so the debit hits the live window
                this.applyWindowResets(subscription)
                // debit BOTH sliding windows by the grading cost under the held lock
                subscription.credit5hUsed += cost
                subscription.creditWeekUsed += cost
                await entityManager.save(subscription)
            },
        )
    }

    /**
     * Full quota snapshot for the UI — caps + used + remaining for BOTH the
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
                return this.toSnapshot(subscription)
            },
        )
    }

    /**
     * Read the user's AI settings — saved lane preference + the capabilities
     * the UI needs to decide which lanes are selectable. Never returns the raw
     * BYOK key.
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
                return this.toSettings(subscription)
            },
        )
    }

    /**
     * Update the user's AI settings: optionally store/clear a BYOK key and set
     * the preferred lane. Validates the chosen lane against the user's
     * capabilities (after the BYOK change is applied) so an unusable lane can
     * never be persisted.
     *
     * @param params - lane + optional BYOK provider/key/clear flag
     * @returns the user's refreshed {@link AiSettings}
     * @throws AiByokInvalidException on malformed BYOK input
     * @throws AiModeNotEntitledException when the chosen lane is unavailable
     */
    async updateSettings({
        userId,
        mode,
        byokProvider,
        byokApiKey,
        clearByok,
    }: UpdateAiSettingsParams): Promise<AiSettings> {
        return this.entityManager.transaction(
            async (entityManager) => {
                const subscription = await this.loadOrCreate(
                    userId,
                    entityManager,
                )
                this.applyWindowResets(subscription)

                // apply BYOK changes first so mode validation sees the new state
                this.applyByokUpdate(
                    subscription,
                    {
                        byokProvider,
                        byokApiKey,
                        clearByok,
                    },
                )

                // validate + persist the chosen lane (when one was supplied)
                if (mode) {
                    this.assertModeAvailable(
                        subscription,
                        mode,
                    )
                    subscription.preferredMode = mode
                }

                await entityManager.save(subscription)
                return this.toSettings(subscription)
            },
        )
    }

    /**
     * Grant a paid tier on successful payment and mark the funding transaction
     * succeeded — both inside one DB transaction. Idempotent: a transaction
     * already marked succeeded is left untouched (so webhook retries are safe).
     *
     * @param params - the owning `userId`, the `tier` to grant, and the
     *  `transactionId` that funded it
     */
    async grantTier({
        userId,
        tier,
        transactionId,
    }: GrantTierParams): Promise<void> {
        await this.entityManager.transaction(
            async (entityManager) => {
                // idempotency guard — skip if this payment was already applied
                const transaction = await entityManager.findOne(
                    TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    },
                )
                if (transaction?.status === TransactionStatus.Succeeded) {
                    return
                }

                // activate the tier for a fresh billing period
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

                // mark the funding transaction succeeded
                await entityManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
            },
        )
    }

    /**
     * Decrypt the user's stored BYOK API key for a grading invoke.
     *
     * @param params - Owner of the subscription row.
     * @returns Plaintext key, or `null` when nothing is stored.
     */
    async getByokApiKey(
        {
            userId,
        }: ResolveEntitlementParams,
    ): Promise<string | null> {
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
        if (!subscription?.byokKeyEncrypted) {
            return null
        }
        const payload = JSON.parse(subscription.byokKeyEncrypted)
        return this.encryptionService.decrypt({
            payload,
        })
    }

    /**
     * Mutate `subscription` BYOK fields per the requested change. Clearing wins
     * over setting; a key without a provider (or vice versa) is rejected.
     *
     * @throws AiByokInvalidException on malformed input
     */
    private applyByokUpdate(
        subscription: AiSubscriptionEntity,
        {
            byokProvider,
            byokApiKey,
            clearByok,
        }: Pick<UpdateAiSettingsParams, "byokProvider" | "byokApiKey" | "clearByok">,
    ): void {
        // wipe the key on explicit request, dropping a now-orphaned preference
        if (clearByok) {
            subscription.byokProvider = null
            subscription.byokKeyEncrypted = null
            if (subscription.preferredMode === AiMode.Byok) {
                subscription.preferredMode = null
            }
            return
        }

        // nothing to store
        if (!byokApiKey && !byokProvider) {
            return
        }

        // provider + key must arrive together
        if (!byokApiKey || !byokProvider) {
            throw new AiByokInvalidException({
                reason: "both provider and API key are required",
            })
        }

        // encrypt at rest (AES-256-GCM); the key never leaves this service
        const payload = this.encryptionService.encrypt({
            plainText: byokApiKey,
        })
        subscription.byokProvider = byokProvider
        subscription.byokKeyEncrypted = JSON.stringify(payload)
    }

    /**
     * Assert the user may run on `mode` given the (post-BYOK-update) entity.
     *
     * @throws AiModeNotEntitledException when the lane is unavailable
     * @throws AiByokInvalidException when byok is chosen without a key on file
     */
    private assertModeAvailable(
        subscription: AiSubscriptionEntity,
        mode: AiMode,
    ): void {
        switch (mode) {
        case AiMode.Auto:
            // free lane — always available
            return
        case AiMode.Premium:
            if (!this.isPremiumActive(subscription)) {
                throw new AiModeNotEntitledException({
                    requestedMode: mode,
                    reason: "no active paid subscription",
                })
            }
            return
        case AiMode.Byok:
            if (!subscription.byokProvider || !subscription.byokKeyEncrypted) {
                throw new AiByokInvalidException({
                    reason: "no BYOK key on file — supply provider + API key",
                })
            }
            return
        }
    }

    /**
     * Build the user-facing {@link AiSettings} view from a (post-reset) entity.
     */
    private toSettings(
        subscription: AiSubscriptionEntity,
    ): AiSettings {
        const canByok = Boolean(subscription.byokProvider)
        const canPremium = this.isPremiumActive(subscription)
        const effectiveMode = this.resolveEffectiveMode(subscription)
        const tier = effectiveMode === AiMode.Premium
            ? subscription.tier
            : null

        return {
            preferredMode: subscription.preferredMode,
            effectiveMode,
            canPremium,
            canByok,
            byokProvider: subscription.byokProvider,
            hasByokKey: Boolean(subscription.byokKeyEncrypted),
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
                byokProvider: null,
                byokKeyEncrypted: null,
                window5hResetAt: now.add(WINDOW_5H_MS,
                    "millisecond").toDate(),
                windowWeekResetAt: now.add(WINDOW_WEEK_MS,
                    "millisecond").toDate(),
                auto5hUsed: 0,
                autoWeekUsed: 0,
                credit5hUsed: 0,
                creditWeekUsed: 0,
            },
        )
        return entityManager.save(created)
    }

    /**
     * Reset a window's counters to 0 and roll its `resetAt` forward when the
     * window has elapsed (or was never initialised). Mutates `subscription`.
     */
    private applyWindowResets(subscription: AiSubscriptionEntity): void {
        const now = this.dayjsService.now()
        if (
            !subscription.window5hResetAt
            || now.isAfter(subscription.window5hResetAt)
        ) {
            subscription.auto5hUsed = 0
            subscription.credit5hUsed = 0
            subscription.window5hResetAt = now
                .add(WINDOW_5H_MS,
                    "millisecond")
                .toDate()
        }
        if (
            !subscription.windowWeekResetAt
            || now.isAfter(subscription.windowWeekResetAt)
        ) {
            subscription.autoWeekUsed = 0
            subscription.creditWeekUsed = 0
            subscription.windowWeekResetAt = now
                .add(WINDOW_WEEK_MS,
                    "millisecond")
                .toDate()
        }
    }

    /**
     * Derive the {@link AiEntitlement} view from a (post-reset) entity for the
     * effective lane — either the caller's `requestedMode` (validated) or the
     * natural mode when none was requested.
     */
    private toEntitlement(
        subscription: AiSubscriptionEntity,
        requestedMode?: AiMode,
        ephemeralByok?: boolean,
    ): AiEntitlement {
        const mode = this.resolveEffectiveMode(
            subscription,
            requestedMode,
            ephemeralByok,
        )
        const tier = mode === AiMode.Premium ? subscription.tier : null
        const allowedCategories = TIER_ALLOWED_CATEGORIES[tier ?? "free"]

        const tierConfig = tier ? this.findTierConfig(tier) : null
        const creditLimit5h = tierConfig?.creditsPer5h ?? 0
        const creditLimitWeek = tierConfig?.creditsPerWeek ?? 0

        return {
            mode,
            allowedCategories,
            byokProvider: subscription.byokProvider,
            autoRemaining5h: Math.max(
                0,
                AUTO_LIMIT_5H - subscription.auto5hUsed,
            ),
            autoRemainingWeek: Math.max(
                0,
                AUTO_LIMIT_WEEK - subscription.autoWeekUsed,
            ),
            creditRemaining5h: Math.max(
                0,
                creditLimit5h - subscription.credit5hUsed,
            ),
            creditRemainingWeek: Math.max(
                0,
                creditLimitWeek - subscription.creditWeekUsed,
            ),
        }
    }

    /**
     * Build the full {@link AiQuotaSnapshot} from a (post-reset) entity — both
     * lanes, with caps from constants (Auto) and the tier catalog (Premium).
     */
    private toSnapshot(
        subscription: AiSubscriptionEntity,
    ): AiQuotaSnapshot {
        const mode = this.resolveEffectiveMode(subscription)
        const tier = mode === AiMode.Premium ? subscription.tier : null
        const tierConfig = tier ? this.findTierConfig(tier) : null
        const creditLimit5h = tierConfig?.creditsPer5h ?? 0
        const creditLimitWeek = tierConfig?.creditsPerWeek ?? 0

        return {
            mode,
            tier,
            auto: {
                limit5h: AUTO_LIMIT_5H,
                used5h: subscription.auto5hUsed,
                remaining5h: Math.max(
                    0,
                    AUTO_LIMIT_5H - subscription.auto5hUsed,
                ),
                limitWeek: AUTO_LIMIT_WEEK,
                usedWeek: subscription.autoWeekUsed,
                remainingWeek: Math.max(
                    0,
                    AUTO_LIMIT_WEEK - subscription.autoWeekUsed,
                ),
            },
            premium: {
                limit5h: creditLimit5h,
                used5h: subscription.credit5hUsed,
                remaining5h: Math.max(
                    0,
                    creditLimit5h - subscription.credit5hUsed,
                ),
                limitWeek: creditLimitWeek,
                usedWeek: subscription.creditWeekUsed,
                remainingWeek: Math.max(
                    0,
                    creditLimitWeek - subscription.creditWeekUsed,
                ),
            },
            window5hResetAt: subscription.window5hResetAt,
            windowWeekResetAt: subscription.windowWeekResetAt,
        }
    }

    /**
     * Resolve the lane to run on.
     *
     * Natural capability order is byok → premium → auto. Resolution precedence:
     * 1. An explicit per-job `requestedMode` — strict: must be one the user is
     *    capable of, else throws.
     * 2. The user's saved `preferredMode` — lenient: used when still valid,
     *    otherwise silently falls back to the natural mode.
     * 3. The natural mode.
     *
     * Capability rules for a chosen lane:
     * - `auto`    — always allowed (free lane).
     * - `premium` — requires an active paid subscription.
     * - `byok`    — requires a BYOK provider on the subscription.
     *
     * @throws AiModeNotEntitledException when an explicit `requestedMode` is
     *  not available
     */
    private resolveEffectiveMode(
        subscription: AiSubscriptionEntity,
        requestedMode?: AiMode,
        ephemeralByok?: boolean,
    ): AiMode {
        const canByok = Boolean(subscription.byokProvider)
        const canPremium = this.isPremiumActive(subscription)
        const naturalMode = canByok
            ? AiMode.Byok
            : canPremium
                ? AiMode.Premium
                : AiMode.Auto

        // no explicit per-job lane → fall back to the saved preference
        if (!requestedMode) {
            return this.resolvePreferredMode(
                subscription.preferredMode,
                naturalMode,
                canPremium,
                canByok,
            )
        }

        switch (requestedMode) {
        case AiMode.Auto:
            // free lane — everyone is entitled
            return AiMode.Auto
        case AiMode.Premium:
            if (!canPremium) {
                throw new AiModeNotEntitledException({
                    requestedMode,
                    reason: "no active paid subscription",
                })
            }
            return AiMode.Premium
        case AiMode.Byok:
            if (ephemeralByok) {
                return AiMode.Byok
            }
            if (!canByok) {
                throw new AiModeNotEntitledException({
                    requestedMode,
                    reason: "no BYOK key on file",
                })
            }
            return AiMode.Byok
        default:
            return naturalMode
        }
    }

    /**
     * Resolve a saved lane preference leniently: honour it while the user is
     * still entitled, otherwise fall back to the natural mode. A null
     * preference means "always follow natural".
     */
    private resolvePreferredMode(
        preferredMode: AiMode | null,
        naturalMode: AiMode,
        canPremium: boolean,
        canByok: boolean,
    ): AiMode {
        if (!preferredMode) {
            return naturalMode
        }
        switch (preferredMode) {
        case AiMode.Auto:
            // free lane — always honoured
            return AiMode.Auto
        case AiMode.Premium:
            return canPremium ? AiMode.Premium : naturalMode
        case AiMode.Byok:
            return canByok ? AiMode.Byok : naturalMode
        }
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
