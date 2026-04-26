import {
    ElasticsearchEntityCoursesService,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"

/**
 * On-demand course indexing (delegates to {@link ElasticsearchEntityCoursesService}).
 */
@Injectable()
export class ElasticsearchCoursesBuildService {
    constructor(
        private readonly entityCourses: ElasticsearchEntityCoursesService,
    ) {
    }

    async buildIndexById(
        courseId: string,
    ): Promise<void> {
        await this.entityCourses.indexById(
            courseId,
        )
    }
}
