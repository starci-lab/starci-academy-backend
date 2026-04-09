import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
    InjectSuperJson
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    ChallengeEntity,
    ChallengeReferenceEntity,
    ChallengeStepEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    ModuleEntity,
    PrerequisiteEntity,
    PreviewContentEntity,
    PricingPhaseEntity,
    QnaEntity,
    ValuePropositionEntity
} from "@modules/databases"
import {
    EntityManager
} from "typeorm"
import {
    ChallengeNotFoundException, 
    CourseNotFoundException,
    LessonVideoNotFoundException
} from "@modules/exceptions"
import SuperJSON from "superjson"
import type {
    LessonVideoRuntimeContextRequest
} from "./types"
import {
    Sha256Service 
} from "@modules/crypto"
import {
    S3UploadService, 
    UploadPayload,
    S3Provider,
    S3NameResolverService
} from "@modules/s3"
import {
    WinstonLog, 
    WinstonService 
} from "@modules/winston"

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
        const hydratedLessonVideo = lessonVideo.toPlain<LessonVideoEntity>();
        // upload the lesson video to the CDN
        const data = this.superJson.stringify(hydratedLessonVideo);
        const hash = this.sha256Service.hash(data)
        const payload: UploadPayload = {
            data,
            hash,
        }
        objectKey = this.s3NameResolverService.lessonVideo(lessonVideo.id)
        await this.s3UploadService.json({
            name: objectKey,
            payload,
            acl: "private",
            providers: [
                S3Provider.DigitalOcean,
                S3Provider.Minio,
            ],
        })
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