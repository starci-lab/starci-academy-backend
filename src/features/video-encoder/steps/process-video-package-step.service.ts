import { Injectable, Logger } from "@nestjs/common"
import { AbstractStepService } from "../abstracts"
import { JobExtendedContext } from "../types"
import { FilenameProcessData } from "@modules/bullmq"
import { JobActionService } from "@modules/bussiness"
import { InjectPrimaryPostgreSQLEntityManager } from "@modules/databases"
import { EntityManager } from "typeorm"

@Injectable()
export class ProcessVideoPackageStepService extends AbstractStepService<FilenameProcessData, undefined> {
    private readonly logger = new Logger(ProcessVideoPackageStepService.name)
    stepIndex = 2
    stepName = "package"

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { assetId }, job } = context
        this.logger.verbose(`3/5. Fragmenting videos and Generating MPEG-DASH & HLS manifest for asset ${assetId}...`)
        
        // TODO: call bento4Service
        // Fragment video
        // await this.bento4Service.fragmentVideo(assetId, videoName)
        
        // Generate DASH
        // await this.bento4Service.generateMpegDashManifestFromFragments(assetId, videoConfig().videoNames)
        
        // Generate HLS
        // await this.bento4Service.generateHlsManifestFromFragments(assetId, videoConfig().videoNames)

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
