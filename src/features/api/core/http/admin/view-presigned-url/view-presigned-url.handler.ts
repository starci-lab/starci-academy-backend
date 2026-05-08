import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    S3BuildService,
    S3Provider,
} from "@modules/s3"
import {
    ViewPresignedUrlCommand,
    type ViewPresignedUrlItem,
} from "./view-presigned-url.command"

@CommandHandler(ViewPresignedUrlCommand)
@Injectable()
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
