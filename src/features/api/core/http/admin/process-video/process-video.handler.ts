import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Queue,
} from "bullmq"
import {
    bullData,
    BullQueueName,
} from "@modules/bullmq"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    v4 as uuidv4,
} from "uuid"
import {
    ProcessVideoCommand,
    type ProcessVideoResult,
} from "./process-video.command"

@CommandHandler(ProcessVideoCommand)
@Injectable()
export class ProcessVideoHandler
    extends ICQRSHandler<ProcessVideoCommand, ProcessVideoResult>
    implements ICommandHandler<ProcessVideoCommand, ProcessVideoResult> {

    private readonly logger = new Logger(ProcessVideoHandler.name)

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessVideo].name)
        private readonly processVideoQueue: Queue<string>,
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
        const filename = pathParts[pathParts.length - 1] || "video.mp4"

        // Generate a unique asset ID
        const assetId = uuidv4()

        // Build the payload — store the full URL so the worker can download
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

        this.logger.log(
            `Video processing job enqueued: ${job.id} for URL: ${url}`,
        )

        return {
            jobId: job.id,
            message: "Video processing job enqueued successfully.",
        }
    }
}
