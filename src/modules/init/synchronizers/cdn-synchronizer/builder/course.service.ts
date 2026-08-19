import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CourseHydrationService,
} from "@modules/databases/postgresql/primary/hydration/course-hydration.service"
import {
    CourseResolverService,
} from "@modules/databases/postgresql/primary/resolvers/course-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

@Injectable()
/**
 * Hydrates a course tree from PostgreSQL and fans it into **per-locale** CDN
 * JSON. CDN pages cannot join translations at request time, so each locale is
 * materialized and uploaded under its S3 key.
 */
export class CdnCourseBuildService {
    constructor(
        private readonly courseHydration: CourseHydrationService,
        private readonly courseResolver: CourseResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
        private readonly winstonService: WinstonService,
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
                const localizedCourse = structuredClone(hydratedCourse)
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
        this.winstonService.log(
            WinstonLog.CdnSynchronizerMaterializeStep,
            {
                step: "hydrate-start",
                entityKind: CourseEntity.name,
                entityId: courseId,
            },
        )
        const hydrateStart = Date.now()
        const hydratedCourse = await this.courseHydration.loadById(
            courseId,
        )
        this.winstonService.log(
            WinstonLog.CdnSynchronizerMaterializeStep,
            {
                step: "hydrate-done",
                entityKind: CourseEntity.name,
                entityId: courseId,
                displayId: hydratedCourse.displayId,
                moduleCount: hydratedCourse.modules?.length ?? 0,
                durationMs: Date.now() - hydrateStart,
            },
        )
        const courses = Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedCourse = structuredClone(hydratedCourse)
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
        await this.materializeAndUploadService.process(
            courses,
            (
                id,
                locale,
            ) => this.s3NameResolverService.course(
                id,
                locale,
            ),
            {
                entityKind: CourseEntity.name,
                entityId: courseId,
                displayId: hydratedCourse.displayId,
            },
        )
    }
}
