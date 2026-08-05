import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import {
    JobExtendedContext,
} from "../types"
import {
    FilenameProcessData,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    WinstonService, WinstonLog,
} from "@modules/winston"
import {
    join,
} from "path"
import {
    tmpdir,
} from "os"
import {
    promises as fsPromise,
} from "fs"

@Injectable()
/**
 * Step 4 — deletes the temp dir and runs `queryAtEnd` so the asset row flips to
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
        if (queryAtEnd && queryAtEnd.length === 2) {
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
