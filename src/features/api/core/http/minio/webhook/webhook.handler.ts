import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
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
    MinioWebhookCommand,
} from "./webhook.command"

@CommandHandler(MinioWebhookCommand)
@Injectable()
/**
 * Acknowledges object events but skips `cv-submissions/` keys -- grading is triggered from
 * the frontend so a storage event cannot auto-start a job.
 */
export class MinioWebhookHandler
    extends ICQRSHandler<MinioWebhookCommand, void>
    implements ICommandHandler<MinioWebhookCommand, void> {
    constructor(
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: MinioWebhookCommand,
    ): Promise<void> {
        const body = command.params
        this.winstonService.log(
            WinstonLog.MinioWebhookReceived,
            {
                op: "minio.webhook.received",
                count: body.Records?.length || 0,
            },
        )

        for (const record of body.Records || []) {
            const key = record.s3?.object?.key
            if (!key) {
                continue
            }

            // CV submissions are now triggered manually from the frontend.
            if (key.startsWith("cv-submissions/")) {
                this.winstonService.log(
                    WinstonLog.MinioWebhookIgnored,
                    {
                        op: "minio.webhook.ignored",
                        meta: {
                            key,
                            reason: "cv-submissions manual-trigger flow",
                        },
                    },
                )
                continue
            }
        }
    }
}
