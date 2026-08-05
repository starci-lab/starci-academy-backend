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
    ViewPresignedUrlCommand,
    type ViewPresignedUrlItem,
} from "./view-presigned-url.command"

@CommandHandler(ViewPresignedUrlCommand)
@Injectable()
/**
 * Builds public (unsigned) MPEG-DASH manifest URLs -- objects are uploaded ACL public-read,
 * so a signed GET would only add expiry the player cannot refresh.
 */
export class ViewPresignedUrlHandler
    extends ICQRSHandler<ViewPresignedUrlCommand, Array<ViewPresignedUrlItem>>
    implements ICommandHandler<ViewPresignedUrlCommand, Array<ViewPresignedUrlItem>> {
    constructor(
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Build direct public URLs for the MPEG-DASH manifest.
     * Files were uploaded with acl: "public-read" so they're directly accessible.
     */
    protected override async process(
        command: ViewPresignedUrlCommand,
    ): Promise<Array<ViewPresignedUrlItem>> {
        const { assetId } = command.params
        const manifestKey = `videos/${assetId}/manifest.mpd`

        // Build direct (non-signed) URLs since files are public-read
        const minioUrl = this.s3BuildService.buildPublicObjectUrl({
            key: manifestKey,
            provider: S3Provider.Minio,
        })
        const digitalOceanUrl = this.s3BuildService.buildPublicObjectUrl({
            key: manifestKey,
            provider: S3Provider.DigitalOcean,
        })

        return [
            {
                provider: S3Provider.Minio,
                manifestUrl: minioUrl,
            },
            {
                provider: S3Provider.DigitalOcean,
                manifestUrl: digitalOceanUrl,
            },
        ]
    }
}
