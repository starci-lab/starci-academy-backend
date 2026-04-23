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
    LessonVideoEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ScyllaDBService,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import _ from "lodash"
import {
    LessonVideoTransformerService,
} from "../../../api/graphql/utils"
import {
    EntityManager,
} from "typeorm"
import type {
    LessonVideoRuntimeContextRequest,
} from "./types"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    ScyllaSyncTables,
} from "../tables"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class LessonVideoRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: LessonVideoRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly scylladb: ScyllaDBService,
        private readonly syncStateService: SyncStateService,
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
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
            envConfig().services.scylladbSynchronizer.syncIntervalMs.lessonVideos.runtime,
        )
    }

    /**
     * Sync the lesson video to ScyllaDB.
     */
    async process() {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }

        const sourceUpdatedAt = lessonVideo.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.ScyllaDB,
                sourceType: SyncStateSourceType.LessonVideo,
                sourceId: this.request.id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>()
            const locales = [Locale.Vi,
                Locale.En]

            for (const locale of locales) {
                const hydratedLessonVideo = _.cloneDeep(plainLessonVideo)

                this.lessonVideoTransformer.transform(
                    hydratedLessonVideo,
                    locale,
                    hydratedLessonVideo.defaultLocale ?? Locale.En,
                )

                const dataToIndex = _.omit(
                    hydratedLessonVideo,
                    ["translations"],
                )
                const localizedDocument = {
                    ...dataToIndex,
                    locale,
                }

                await this.scylladb.upsertLocalizedDocument(
                    ScyllaSyncTables.lessonVideos,
                    hydratedLessonVideo.id,
                    locale,
                    localizedDocument,
                )
            }

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.LessonVideo,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.LessonVideo,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
