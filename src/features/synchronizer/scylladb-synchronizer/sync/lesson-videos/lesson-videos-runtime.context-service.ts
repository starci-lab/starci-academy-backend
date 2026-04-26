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
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
    ScyllaDBService,
} from "@modules/databases"
import _ from "lodash"
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
        private readonly lessonVideoResolver: LessonVideoResolverService,
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

        const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>()
        const locales = [Locale.Vi,
            Locale.En]

        for (const locale of locales) {
            const hydratedLessonVideo = _.cloneDeep(plainLessonVideo)

            this.lessonVideoResolver.transform(
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
    }
}
