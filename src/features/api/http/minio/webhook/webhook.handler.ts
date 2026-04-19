import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    MinioWebhookCommand,
} from "./webhook.command"

@CommandHandler(MinioWebhookCommand)
@Injectable()
export class MinioWebhookHandler
    extends ICQRSHandler<MinioWebhookCommand, void>
    implements ICommandHandler<MinioWebhookCommand, void> {
    private readonly logger = new Logger(MinioWebhookHandler.name)

    constructor() {
        super()
    }

    protected override async process(
        command: MinioWebhookCommand,
    ): Promise<void> {
        const body = command.params
        this.logger.log(`Received MinIO webhook with ${body.Records?.length || 0} records.`)

        for (const record of body.Records || []) {
            const key = record.s3?.object?.key
            if (!key) {
                continue
            }

            // CV submissions are now triggered manually from the frontend.
            if (key.startsWith("cv-submissions/")) {
                this.logger.log(`Ignoring CV upload webhook for manual-trigger flow: ${key}`)
                continue
            }
        }
    }
}
