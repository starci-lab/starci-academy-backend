import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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

/**
 * Loads a lesson video row from PostgreSQL and materializes **per-locale** plain objects
 * (after `LessonVideoResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnLessonVideoBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed lesson video payload.
     */
    async buildMultilingualByLessonVideoId(
        lessonVideoId: string,
    ): Promise<Array<LocalizedCdnEntity<LessonVideoEntity>>> {
        const hydratedLessonVideo = await this.loadHydratedLessonVideoPlain(
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

    /**
     * Loads the hydrated lesson video plain object from PostgreSQL.
     * @param id - The lesson video id.
     * @returns The hydrated lesson video plain object.
     */
    private async loadHydratedLessonVideoPlain(
        id: string,
    ): Promise<LessonVideoEntity> {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id,
                }
            )
        }
        return lessonVideo.toPlain<LessonVideoEntity>()
    }

    /**
     * Materialize and upload the lesson videos to the CDN.
     * @param lessonVideoId - The lesson video id to materialize and upload.
     */
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