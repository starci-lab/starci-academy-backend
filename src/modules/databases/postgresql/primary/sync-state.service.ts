import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "./primary.decorators"
import {
    SyncStateEntity,
} from "./entities"
import {
    SyncStateSourceType,
    SyncStateStatus,
    SyncStateTarget,
} from "./enums"

interface SyncStateKey {
    target: SyncStateTarget
    sourceType: SyncStateSourceType
    sourceId: string
}

interface SyncStateSyncInput extends SyncStateKey {
    sourceUpdatedAt: Date
}

@Injectable()
export class SyncStateService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    /**
     * Returns true when the target should be synced for this source snapshot.
     * Also transitions the row into `syncing` when work is needed.
     */
    async shouldSync(
        input: SyncStateSyncInput,
    ) {
        const state = await this.findOne(input)
        const sourceUpdatedAtMs = input.sourceUpdatedAt.getTime()

        if (!state) {
            await this.entityManager.save(
                SyncStateEntity,
                {
                    target: input.target,
                    sourceType: input.sourceType,
                    sourceId: input.sourceId,
                    sourceUpdatedAt: input.sourceUpdatedAt,
                    status: SyncStateStatus.Syncing,
                    syncedAt: null,
                    retryCount: 0,
                    lastError: null,
                    nextRetryAt: null,
                },
            )
            return true
        }

        const stateUpdatedAtMs = state.sourceUpdatedAt.getTime()
        if (
            state.status === SyncStateStatus.Synced
            && stateUpdatedAtMs >= sourceUpdatedAtMs
        ) {
            return false
        }

        if (
            state.status === SyncStateStatus.Syncing
            && stateUpdatedAtMs >= sourceUpdatedAtMs
        ) {
            return false
        }

        await this.entityManager.save(
            SyncStateEntity,
            {
                ...state,
                sourceUpdatedAt: input.sourceUpdatedAt,
                status: SyncStateStatus.Syncing,
                lastError: null,
                nextRetryAt: null,
            },
        )
        return true
    }

    /** Mark the source snapshot as synced for the target. */
    async markSynced(
        input: SyncStateSyncInput,
    ) {
        const state = await this.findOne(input)

        await this.entityManager.save(
            SyncStateEntity,
            {
                ...(state ?? {
                    target: input.target,
                    sourceType: input.sourceType,
                    sourceId: input.sourceId,
                }),
                sourceUpdatedAt: input.sourceUpdatedAt,
                status: SyncStateStatus.Synced,
                syncedAt: new Date(),
                retryCount: 0,
                lastError: null,
                nextRetryAt: null,
            },
        )
    }

    /** Mark a failed sync attempt and schedule retry with bounded exponential backoff. */
    async markFailed(
        input: SyncStateSyncInput & { error: unknown },
    ) {
        const state = await this.findOne(input)
        const retryCount = (state?.retryCount ?? 0) + 1
        const backoffMs = Math.min(2 ** retryCount * 1000,
            5 * 60 * 1000)
        const now = Date.now()

        await this.entityManager.save(
            SyncStateEntity,
            {
                ...(state ?? {
                    target: input.target,
                    sourceType: input.sourceType,
                    sourceId: input.sourceId,
                }),
                sourceUpdatedAt: input.sourceUpdatedAt,
                status: SyncStateStatus.Failed,
                retryCount,
                lastError: this.toErrorMessage(input.error),
                nextRetryAt: new Date(now + backoffMs),
            },
        )
    }

    private async findOne(input: SyncStateKey) {
        return this.entityManager.findOne(
            SyncStateEntity,
            {
                where: {
                    target: input.target,
                    sourceType: input.sourceType,
                    sourceId: input.sourceId,
                },
            },
        )
    }

    private toErrorMessage(error: unknown) {
        if (error instanceof Error) {
            return error.message
        }
        if (typeof error === "string") {
            return error
        }
        try {
            return JSON.stringify(error)
        } catch {
            return "Unknown sync error"
        }
    }
}
