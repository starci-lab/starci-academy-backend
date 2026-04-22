import {
    BullQueueName,
    InviteGithubPayload,
    bullData
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    InjectSuperJson
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Job
} from "bullmq"
import {
    Octokit,
} from "octokit"
import SuperJSON from "superjson"

/**
 * Worker for GitHub team invitation.
 */
@Worker(
    bullData[BullQueueName.InviteGithub].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    }
)
@Injectable()
export class InviteGithubWorker extends WorkerHost {
    private readonly logger = new Logger(InviteGithubWorker.name)

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly mountStorageService: MountStorageService,
    ) {
        super()
    }

    /**
     * Process GitHub team invitation job.
     * @param bullmqJob - The BullMQ job
     */
    async process(bullmqJob: Job<string>) {
        let payload: InviteGithubPayload | undefined

        try {
            // Parse payload
            payload = this.superJson.parse<InviteGithubPayload>(bullmqJob.data)

            // Get job record
            const job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? "",
            })

            // Initialize Octokit with GitHub token
            const octokit = new Octokit({
                auth: this.mountStorageService.githubAccessToken,
            })

            // Get organization from env config
            const org = envConfig().services.github.organization
            const teamSlug = payload.teamSlug

            // Invite user to GitHub organization team
            await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
                org,
                team_slug: teamSlug,
                username: payload.githubUsername,
                role: "member",
            })
            // Mark job as completed
            await this.jobActionService.completeJob({
                job,
            })
            this.logger.log(
                `Successfully invited ${payload.githubUsername} to ${org}/${teamSlug}`
            )
        } catch (error) {
            this.logger.error(
                `Failed to invite GitHub user: ${error instanceof Error ? error.message : String(error)}`
            )
            throw error
        }
    }
}
