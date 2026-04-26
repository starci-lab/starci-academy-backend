import {
    Sha256Service
} from "@modules/crypto"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
} from "@modules/databases"
import {
    envConfig
} from "@modules/env"
import {
    LessonVideoNotFoundException
} from "@modules/exceptions"
import {
    AsyncService,
    InjectSuperJson
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3Provider,
    S3UploadService,
    UploadPayload
} from "@modules/s3"
import {
    WinstonLog,
    WinstonService
} from "@modules/winston"
import {
    Inject,
    Injectable,
    Scope
} from "@nestjs/common"
import {
    REQUEST
} from "@nestjs/core"
import _ from "lodash"
import SuperJSON from "superjson"
import {
    EntityManager
} from "typeorm"
import type {
    LessonVideoRuntimeContextRequest
} from "./types"

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
    @InjectSuperJson()
    private readonly superJson: SuperJSON,
    private readonly asyncService: AsyncService,
    private readonly sha256Service: Sha256Service,
    private readonly s3UploadService: S3UploadService,
    private readonly s3NameResolverService: S3NameResolverService,
    private readonly winstonService: WinstonService,
    private readonly lessonVideoResolver: LessonVideoResolverService,
    ) {}

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
            envConfig().services.cdnSynchronizer.syncIntervalMs.lessons.runtime
        )
    }

    /**
   * Sync the lesson video to the CDN.
   */
    async process() {
        let objectKey: string | undefined
        try {
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
        
            const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>()
            const locales = [Locale.Vi,
                Locale.En]

            await Promise.all(locales.map(async (locale) => {
            // deep clone the plain object to avoid mutating the original
                const hydratedLessonVideo = _.cloneDeep(plainLessonVideo)

                // transform the lesson video clone for the current locale
                this.lessonVideoResolver.transform(
                    hydratedLessonVideo,
                    locale,
                    hydratedLessonVideo.defaultLocale ?? Locale.En,
                )

                // upload the lesson video to the CDN
                const data = this.superJson.stringify(hydratedLessonVideo)
                const hash = this.sha256Service.hash(data)
                const payload: UploadPayload = {
                    data,
                    hash,
                }
                const currentObjectKey = this.s3NameResolverService.lessonVideo(lessonVideo.id,
                    locale)
            
                await this.s3UploadService.json({
                    name: currentObjectKey,
                    payload,
                    acl: "private",
                    providers: [
                        S3Provider.DigitalOcean,
                        S3Provider.Minio,
                    ],
                })
            }))
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerLessonVideoRuntimeSyncFailed,
                {
                    id: this.request.id,
                    objectKey,
                    providers: [
                        S3Provider.DigitalOcean,
                        S3Provider.Minio,
                    ],
                    error: error.message,
                    context: LessonVideoRuntimeContextService.name,
                },
            )
        }
    }
}