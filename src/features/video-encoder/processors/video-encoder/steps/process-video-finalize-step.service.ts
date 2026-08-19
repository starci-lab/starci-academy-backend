import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    FilenameProcessData,
} from "@modules/integrations/bullmq/types/payloads/process-video"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    join,
} from "node:path"
import {
    tmpdir,
} from "node:os"
import {
    promises as fsPromise,
} from "node:fs"

@Injectable()
/**
 * Step 4 -- deletes the temp dir and runs `queryAtEnd` so the asset row flips to
 * ready only after upload succeeded. Cleanup is best-effort: a leftover temp
 * dir must not fail the job once bytes are already public.
 */
export class ProcessVideoFinalizeStepService extends AbstractStepService<FilenameProcessData, undefined> {
    stepIndex = 4
    stepName = "finalize"

    constructor(
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    async process(context: JobExtendedContext<FilenameProcessData, undefined>): Promise<void> {
        const { payload: { callbackQueries, assetId }, job } = context
        const taskDir = join(tmpdir(),
            `video-encoder-${assetId}`)

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                meta: {
                    assetId, message: "Cleaning up and finalizing..." 
                },
            })

        // Clean up temp directory
        try {
            await fsPromise.rm(taskDir,
                {
                    recursive: true, force: true 
                })
        } catch (error) {
            this.winstonService.log(WinstonLog.ProcessStepExecuted,
                {
                    jobId: job.id,
                    step: this.stepName,
                    stepIndex: this.stepIndex,
                    success: false,
                    error: `Failed to clean up: ${error.message}`,
                })
        }

        // Execute query at end
        const { queryAtEnd } = callbackQueries
        if (queryAtEnd?.length === 2) {
            await this.entityManager.query(queryAtEnd[0],
                queryAtEnd[1])
        }

        this.winstonService.log(WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id,
                step: this.stepName,
                stepIndex: this.stepIndex,
                success: true,
                meta: {
                    assetId 
                },
            })

        await this.entityManager.transaction(async (em) => {
            await this.jobActionService.increaseJob({
                job, entityManager: em,
            })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult: {
                },
                entityManager: em,
            })
        })
    }
}
