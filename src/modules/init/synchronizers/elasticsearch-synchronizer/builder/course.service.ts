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
    buildCompletionSuggest,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a course and indexes **per-locale** ES docs with title completion.
 * Same hydrate-once / fan-out as the CDN course builder, but writes search
 * documents instead of S3 JSON.
 */
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
                // populate the ES completion field: the localized course title as the
                // suggest input (the resolver already swapped in the per-locale title,
                // so no localized wrapper remains to strip), weighted by display order
                // (earlier = more popular) so the FST-backed autocomplete returns
                // clean, ranked suggestions.
                const label = (clonedCourse.title ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: label.length > 0 ? [label] : [],
                    weight: Math.max(1,
                        100 - (clonedCourse.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        clonedCourse,
                        {
                            suggest,
                        },
                    ),
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
