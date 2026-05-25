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
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import _ from "lodash"

@Injectable()
export class CdnCourseBuildService {
    constructor(
        private readonly courseHydration: CourseHydrationService,
        private readonly courseResolver: CourseResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    async buildMultilingualByCourseId(
        courseId: string,
    ): Promise<Array<LocalizedCdnEntity<CourseEntity>>> {
        const hydratedCourse = await this.courseHydration.loadById(
            courseId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedCourse = _.cloneDeep(hydratedCourse)
                this.courseResolver.transform(
                    localizedCourse,
                    locale,
                )
                return {
                    locale,
                    entity: localizedCourse,
                }
            },
        )
    }

    async materializeAndUpload(
        courseId: string,
    ): Promise<void> {
        const courses = await this.buildMultilingualByCourseId(
            courseId,
        )
        await this.materializeAndUploadService.process(
            courses,
            (
                id,
                locale,
            ) => this.s3NameResolverService.course(
                id,
                locale,
            ),
        )
    }
}
