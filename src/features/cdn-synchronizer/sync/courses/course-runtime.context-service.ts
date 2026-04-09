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
    CourseNotFoundException
} from "@modules/exceptions"
import SuperJSON from "superjson"
import type {
    CourseRuntimeContextRequest
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
export class CourseRuntimeContextService {
  constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    @Inject(REQUEST)
    private readonly request: CourseRuntimeContextRequest,
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
        envConfig().services.cdnSynchronizer.syncIntervalMs.courses.runtime
    )
  }

  /**
   * Sync the course to the CDN.
   */
  async process() {
    let objectKey: string | undefined
    try {
        // take the course
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
        const hydratedCourse = course.toPlain<CourseEntity>()
        // take all prerequisites related to the course
        const prerequisites = await this.entityManager.find(
            PrerequisiteEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
            }
        )
        const hydratedPrerequisites = prerequisites?.map((prerequisite) => prerequisite.toPlain<PrerequisiteEntity>())  
        // take all value propositions related to the course
        const valuePropositions = await this.entityManager.find(
            ValuePropositionEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
            }
        )
        const hydratedValuePropositions = valuePropositions?.map((valueProposition) =>
          valueProposition.toPlain<ValuePropositionEntity>(),
        );  
        // take all qnas related to the course
        const qnas = await this.entityManager.find(
            QnaEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
            }
        )
        const hydratedQnas = qnas?.map((qna) => qna.toPlain<QnaEntity>())  
        // take all pricing phases related to the course
        const pricingPhases = await this.entityManager.find(
            PricingPhaseEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
            }
        )
        const hydratedPricingPhases = pricingPhases?.map((pricingPhase) => pricingPhase.toPlain<PricingPhaseEntity>())  
        // take all modules related to the course
        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
            }
        )
        const hydratedModules = modules?.map((module) => module.toPlain<ModuleEntity>())  

        hydratedCourse.prerequisites = hydratedPrerequisites
        hydratedCourse.valuePropositions = hydratedValuePropositions
        hydratedCourse.qnas = hydratedQnas
        hydratedCourse.pricingPhases = hydratedPricingPhases
        hydratedCourse.modules = hydratedModules
        // upload the course to the CDN
        const data = this.superJson.stringify(hydratedCourse)
        const hash = this.sha256Service.hash(data)
        const payload: UploadPayload = {
            data,
            hash,
        }
        objectKey = this.s3NameResolverService.course(hydratedCourse.id)
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
            WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed,
            {
                id: this.request.id,
                objectKey,
                providers: [
                    S3Provider.DigitalOcean,
                    S3Provider.Minio,
                ],
                error: error.message,
                context: CourseRuntimeContextService.name,
            },
        )
    }
  }
}