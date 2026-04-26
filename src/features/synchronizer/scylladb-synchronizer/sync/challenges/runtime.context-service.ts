import {
    envConfig,
} from "@modules/env"
import {
    AsyncService,
} from "@modules/mixin"
import {
    Inject,
    Injectable,
    Scope,
} from "@nestjs/common"
import {
    REQUEST,
} from "@nestjs/core"
import {
    ChallengeEntity,
    ChallengeResolverService,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ScyllaDBService,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import type {
    ChallengeRuntimeContextRequest,
} from "./types"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import _ from "lodash"
import {
    ScyllaSyncTables,
} from "../tables"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ChallengeRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: ChallengeRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly scylladb: ScyllaDBService,
        private readonly syncStateService: SyncStateService,
        private readonly challengeResolver: ChallengeResolverService,
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process(),
                )
            },
            envConfig().services.scylladbSynchronizer.syncIntervalMs.challenges.runtime,
        )
    }

    /**
     * Sync the challenge to ScyllaDB.
     */
    async process() {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
        const sourceUpdatedAt = challenge.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.ScyllaDB,
                sourceType: SyncStateSourceType.Challenge,
                sourceId: this.request.id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainChallenge = challenge.toPlain<ChallengeEntity>()

            const steps = await this.entityManager.find(
                ChallengeStepEntity,
                {
                    where: {
                        challenge: {
                            id: plainChallenge.id,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )

            const hydratedSteps = steps?.map((step) => step.toPlain<ChallengeStepEntity>())
            plainChallenge.steps = hydratedSteps

            const locales = [Locale.Vi,
                Locale.En]
            for (const locale of locales) {
                const hydratedChallenge = _.cloneDeep(plainChallenge)

                this.challengeResolver.transform(
                    hydratedChallenge,
                    locale,
                    hydratedChallenge.defaultLocale ?? Locale.En,
                )

                const dataToIndex = _.omit(
                    hydratedChallenge,
                    ["translations"],
                )
                const localizedDocument = {
                    ...dataToIndex,
                    locale,
                }

                await this.scylladb.upsertLocalizedDocument(
                    ScyllaSyncTables.challenges,
                    hydratedChallenge.id,
                    locale,
                    localizedDocument,
                )
            }

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.Challenge,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.Challenge,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
