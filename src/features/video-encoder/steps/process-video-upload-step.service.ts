import { Injectable, Logger } from "@nestjs/common"
import { AbstractStepService } from "../abstracts"
import { JobExtendedContext } from "../types"
import { FilenameProcessData } from "@modules/bullmq"
import { JobActionService } from "@modules/bussiness"
import { InjectPrimaryPostgreSQLEntityManager } from "@modules/databases"
import { EntityManager } from "typeorm"

@Injectable()
export class ProcessVideoUploadStepService extends AbstractStepService<FilenameProcessData, undefined> {
    private readonly logger = new Logger(ProcessVideoUploadStepService.name)
    stepIndex = 3
    stepName = "upload"

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId }, job } = context
        this.logger.verbose(`4/5. Uploading manifests and fragments for asset ${assetId}...`)
        
        // TODO: upload files recursively
        // await this.uploadMpegDashManifest(assetId)
        // await this.uploadHlsManifest(assetId)

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({ job, entityManager: em })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult: {},
                entityManager: em,
            })
        })
    }
}
