import {
    CourseEntity,
    CourseHydrationService,
    CourseResolverService,
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
export class ElasticsearchCourseBuildService {
    constructor(
        private readonly courseHydration: CourseHydrationService,
        private readonly courseResolver: CourseResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByCourseId(
        courseId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<CourseEntity>>> {
        const hydratedCourse = await this.courseHydration.loadById(
            courseId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const clonedCourse = _.cloneDeep(hydratedCourse)
                this.courseResolver.transform(
                    clonedCourse,
                    locale,
                )
                return {
                    locale,
                    entity: clonedCourse,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByCourseId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: CourseEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
