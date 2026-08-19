import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Queue,
} from "bullmq"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import SuperJSON from "superjson"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    v4 as uuidv4,
} from "uuid"
import {
    ProcessVideoCommand,
    type ProcessVideoResult,
} from "./process-video.command"

@CommandHandler(ProcessVideoCommand)
@Injectable()
/**
 * Enqueues video processing with the full source URL so the worker can download after the
 * admin request has already returned.
 */
export class ProcessVideoHandler
    extends ICQRSHandler<ProcessVideoCommand, ProcessVideoResult>
    implements ICommandHandler<ProcessVideoCommand, ProcessVideoResult> {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessVideo].name)
        private readonly processVideoQueue: Queue<string>,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    /**
     * Enqueue a video processing job.
     */
    protected override async process(
        command: ProcessVideoCommand,
    ): Promise<ProcessVideoResult> {
        const { url } = command.params

        // Extract a filename from the URL for the worker
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split("/")
        const filename = pathParts.at(-1) || "video.mp4"

        // Generate a unique asset ID
        const assetId = uuidv4()

        // Build the payload -- store the full URL so the worker can download
        const payload = {
            assetId,
            filename,
            url,
            callbackQueries: {
                queryAtStart: ["SELECT 1",
                    []] as readonly [string, unknown[]],
                queryAtEnd: ["SELECT 1",
                    []] as readonly [string, unknown[]],
            },
        }

        // Create a job entity
        const job = await this.jobActionService.createJob({
            id: assetId,
            actionType: ActionType.ProcessVideo,
            maxSteps: 5,
            payload: this.superJson.stringify(payload),
        })

        // Push to BullMQ queue
        await this.processVideoQueue.add(
            job.id,
            this.superJson.stringify(payload),
            {
                jobId: job.id,
            },
        )

        this.winstonService.log(
            WinstonLog.VideoProcessingEnqueued,
            {
                op: "admin.process-video.enqueue",
                jobId: job.id,
                meta: {
                    url,
                },
            },
        )

        return {
            jobId: job.id,
            message: "Video processing job enqueued successfully.",
        }
    }
}
