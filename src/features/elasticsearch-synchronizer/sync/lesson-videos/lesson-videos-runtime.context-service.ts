import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    LessonVideoEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import _ from "lodash"
import {
    LessonVideoTransformerService,
} from "../../../api/graphql/utils"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    LessonVideoRuntimeContextRequest,
} from "./types"
import { LessonVideoNotFoundException } from "@modules/exceptions"

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
        private readonly elasticsearch: ElasticsearchService,
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
                    async () => await this.process()
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.lessonVideos.runtime
        )
    }

    /**
     * Sync the lesson video to Elasticsearch.
     */
    async process() {
        // take the lesson video
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }

        const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>();
        const locales = [Locale.Vi, Locale.En]

        for (const locale of locales) {
            // deep clone the plain object to avoid mutating the original
            const hydratedLessonVideo = _.cloneDeep(plainLessonVideo)

            // transform the lesson video clone for the current locale
            this.lessonVideoTransformer.transform(
                hydratedLessonVideo,
                locale,
                hydratedLessonVideo.defaultLocale ?? Locale.En,
            )

            const { translations, ...dataToIndex } = hydratedLessonVideo;

            // Use the original UUID for the 'id' field in the document body,
            // but use a composite key (uuid-locale) for the Elasticsearch document ID (_id).
            const indexedData = {
                ...dataToIndex,
                locale,
            }

            await this.elasticsearch.indexEntity(
                LessonVideoEntity,
                indexedData,
                `${hydratedLessonVideo.id}-${locale}`,
            );
        }
    }
}
