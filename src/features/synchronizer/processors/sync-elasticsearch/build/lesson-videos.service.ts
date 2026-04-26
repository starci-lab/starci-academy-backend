import {
    ElasticsearchEntityLessonVideosService,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"

/**
 * On-demand lesson-video indexing (delegates to {@link ElasticsearchEntityLessonVideosService}).
 */
@Injectable()
export class ElasticsearchLessonVideosBuildService {
    constructor(
        private readonly entityLessonVideos: ElasticsearchEntityLessonVideosService,
    ) {
    }

    async buildIndexById(
        lessonVideoId: string,
    ): Promise<void> {
        await this.entityLessonVideos.indexById(
            lessonVideoId,
        )
    }
}
