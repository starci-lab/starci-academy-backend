import {
    LessonVideoEntity,
    LessonVideoHydrationService,
    LessonVideoResolverService,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
export class ElasticsearchLessonVideoBuildService {
    constructor(
        private readonly lessonVideoHydration: LessonVideoHydrationService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByLessonVideoId(
        lessonVideoId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<LessonVideoEntity>>> {
        const hydratedLessonVideo = await this.lessonVideoHydration.loadById(
            lessonVideoId,
        )
        const defaultLocale = hydratedLessonVideo.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedLessonVideo = _.cloneDeep(hydratedLessonVideo)
                this.lessonVideoResolver.transform(
                    localizedLessonVideo,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedLessonVideo,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByLessonVideoId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: LessonVideoEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
