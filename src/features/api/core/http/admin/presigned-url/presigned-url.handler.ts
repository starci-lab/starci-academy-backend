import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    PresignedUrlCommand,
    type PresignedUrlItem,
} from "./presigned-url.command"

@CommandHandler(PresignedUrlCommand)
@Injectable()
/**
 * Mints PUT URLs for both MinIO and DigitalOcean so the browser uploads bytes directly and
 * the API never proxies the file body.
 */
export class PresignedUrlHandler
    extends ICQRSHandler<PresignedUrlCommand, Array<PresignedUrlItem>>
    implements ICommandHandler<PresignedUrlCommand, Array<PresignedUrlItem>> {
    constructor(
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Generate presigned PUT URLs for both MinIO and DigitalOcean.
     */
    protected override async process(
        command: PresignedUrlCommand,
    ): Promise<Array<PresignedUrlItem>> {
        const {
            key,
            contentType,
        } = command.params

        const [minioUrl,
            digitalOceanUrl] = await Promise.all([
            this.s3BuildService.buildSignedPutObjectUrl({
                key,
                provider: S3Provider.Minio,
                contentType,
            }),
            this.s3BuildService.buildSignedPutObjectUrl({
                key,
                provider: S3Provider.DigitalOcean,
                contentType,
            }),
        ])

        return [
            {
                provider: S3Provider.Minio,
                url: minioUrl,
            },
            {
                provider: S3Provider.DigitalOcean,
                url: digitalOceanUrl,
            },
        ]
    }
}
