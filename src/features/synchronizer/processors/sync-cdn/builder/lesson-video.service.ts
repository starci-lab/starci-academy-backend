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
export class CdnLessonVideoBuildService {
    constructor(
        private readonly lessonVideoHydration: LessonVideoHydrationService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    async buildMultilingualByLessonVideoId(
        lessonVideoId: string,
    ): Promise<Array<LocalizedCdnEntity<LessonVideoEntity>>> {
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

    async materializeAndUpload(
        lessonVideoId: string,
    ): Promise<void> {
        const lessonVideos = await this.buildMultilingualByLessonVideoId(
            lessonVideoId,
        )
        await this.materializeAndUploadService.process(
            lessonVideos,
            (
                id,
                locale,
            ) => this.s3NameResolverService.lessonVideo(
                id,
                locale,
            ),
        )
    }
}
