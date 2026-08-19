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
    NotAllowExtensionsException,
} from "@modules/platform/exceptions/errors/api/not-allow-extensions"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    randomUUID,
} from "node:crypto"
import {
    GenerateAvatarPresignUrlCommand,
} from "./generate-avatar-presign-url.command"
import {
    GenerateAvatarPresignUrlResponseData,
} from "./graphql-types/response"
import {
    ALLOWED_AVATAR_MIME_TYPES,
    AVATAR_KEY_PREFIX,
    AVATAR_MIME_EXTENSION,
} from "../shared/avatar"

@CommandHandler(GenerateAvatarPresignUrlCommand)
@Injectable()
/**
 * Mints a presigned PUT URL the client uploads its avatar to directly (the bytes
 * never transit the API). Avatars go to MinIO (public via bucket policy, no ACL
 * header needed). Persisting the URL on the user happens in the verify step.
 */
export class GenerateAvatarPresignUrlHandler
    extends ICQRSHandler<GenerateAvatarPresignUrlCommand, GenerateAvatarPresignUrlResponseData>
    implements ICommandHandler<GenerateAvatarPresignUrlCommand, GenerateAvatarPresignUrlResponseData> {
    constructor(
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Validate the content type, derive a per-user object key and return a
     * presigned PUT URL plus that key (echoed back to verify).
     *
     * @param command - {@link GenerateAvatarPresignUrlCommand}
     * @returns the presigned URL + object key.
     */
    protected override async process(
        command: GenerateAvatarPresignUrlCommand,
    ): Promise<GenerateAvatarPresignUrlResponseData> {
        const {
            user,
            request,
        } = command.params
        // only allow image types so the avatar key never points at a non-image
        if (!ALLOWED_AVATAR_MIME_TYPES.includes(request.contentType)) {
            throw new NotAllowExtensionsException({
                extensions: ALLOWED_AVATAR_MIME_TYPES as Array<string>,
                extension: request.contentType,
                fileName: request.contentType,
            })
        }
        // per-user folder + random name + type-driven ext -> no collisions, no
        // leaked client filename; the prefix is what the verify step authorises
        const extension = AVATAR_MIME_EXTENSION[request.contentType]
        const key = `${AVATAR_KEY_PREFIX}/${user.id}/${randomUUID()}.${extension}`
        // presigned PUT bound to this exact key + content type
        const url = await this.s3BuildService.buildSignedPutObjectUrl({
            key,
            provider: S3Provider.Minio,
            contentType: request.contentType,
        })
        return {
            url,
            key,
        }
    }
}
