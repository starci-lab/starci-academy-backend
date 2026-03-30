import {
    BullQueueName,
    ProccessGitUrlPayload,
    bullData,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
    JobCommonService,
} from "@modules/bussiness/jobs"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    ProccessGitUrlLoadDocsStepService,
} from "./proccess-git-url-load-docs-step.service"
import {
    ProccessGitUrlSplitDocsStepService,
} from "./proccess-git-url-split-docs-step.service"
import {
    ProccessGitUrlVectorizeStepService,
} from "./proccess-git-url-vectorize-step.service"

@Worker(
    bullData[BullQueueName.ProccessGitUrl].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProccessGitUrlWorker extends WorkerHost {
    constructor(
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly jobActionService: JobActionService,
        private readonly jobCommonService: JobCommonService,
        private readonly proccessGitUrlLoadDocsStepService: ProccessGitUrlLoadDocsStepService,
        private readonly proccessGitUrlSplitDocsStepService: ProccessGitUrlSplitDocsStepService,
        private readonly proccessGitUrlVectorizeStepService: ProccessGitUrlVectorizeStepService,
    ) {
        super()
    }

    async process(bullmqJob: Job<string>) {
        const payload = this.superJson.parse<ProccessGitUrlPayload>(bullmqJob.data)
        const jobRecord = await this.jobCommonService.getJobOrThrow({
            id: payload.jobId,
        })
        try {
            const docs = await this.proccessGitUrlLoadDocsStepService.execute({
                githubUrl: payload.githubUrl,
                branch: payload.branch,
            })
            await this.jobActionService.increaseJob({
                id: jobRecord.id,
            })

            const chunks = await this.proccessGitUrlSplitDocsStepService.execute({
                docs,
            })
            await this.jobActionService.increaseJob({
                id: jobRecord.id,
            })

            await this.proccessGitUrlVectorizeStepService.execute({
                chunks,
                collectionName: payload.collectionName,
            })
            await this.jobActionService.increaseJob({
                id: jobRecord.id,
            })
        } catch (error) {
            await this.jobActionService.failJob({
                id: jobRecord.id,
                error: error instanceof Error ? error.message : "Unknown error",
            })
            throw error
        }
    }
}
