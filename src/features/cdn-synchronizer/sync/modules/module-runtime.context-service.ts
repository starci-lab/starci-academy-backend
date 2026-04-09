import {
    Sha256Service
} from "@modules/crypto"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
    PreviewContentEntity,
    SubmissionEntity
} from "@modules/databases"
import {
    envConfig
} from "@modules/env"
import {
    ModuleNotFoundException
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
import SuperJSON from "superjson"
import {
    EntityManager
} from "typeorm"
import { 
    type RuntimeContextRequest 
} from "../types"

@Injectable({
  scope: Scope.REQUEST,
  durable: true,
})
export class ModuleRuntimeContextService {
  constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    @Inject(REQUEST)
    private readonly request: RuntimeContextRequest,
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
        envConfig().services.cdnSynchronizer.syncIntervalMs.modules.runtime
    )
  }

  /**
   * Sync the modules to the CDN.
   */
  async process() {
    let objectKey: string | undefined
    try {
        // take the modules
        const module = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!module) {
            throw new ModuleNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
        const hydratedModule = module.toPlain<ModuleEntity>()

        // take all preview contents related to the module
        const previewContents = await this.entityManager.find(
            PreviewContentEntity,
            {
                where: {
                    module: {
                        id: hydratedModule.id,
                    },
                },
                relations: {
                    translations: true,
                },
            }
        )
        const hydratedPreviewContents = previewContents?.map((previewContent) => previewContent.toPlain<PreviewContentEntity>())  
        //take all submissions related to the module
        const submissions = await this.entityManager.find(
            SubmissionEntity,
            {
                where: {
                    module: {
                        id: hydratedModule.id,
                    },
                },
            }
        )
        const hydratedSubmissions = submissions?.map((submission) => submission.toPlain<SubmissionEntity>())  
        hydratedModule.submissions = hydratedSubmissions
        hydratedModule.previewContents = hydratedPreviewContents
        // upload the module to the CDN
        const data = this.superJson.stringify(hydratedModule);
        const hash = this.sha256Service.hash(data)
        const payload: UploadPayload = {
            data,
            hash,
        }
        objectKey = this.s3NameResolverService.module(hydratedModule.id)
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
            WinstonLog.CdnSynchronizerModuleRuntimeSyncFailed,
            {
                id: this.request.id,
                objectKey,
                providers: [
                    S3Provider.DigitalOcean,
                    S3Provider.Minio,
                ],
                error: error.message,
                context: ModuleRuntimeContextService.name,
            },
        )
    }
  }
}