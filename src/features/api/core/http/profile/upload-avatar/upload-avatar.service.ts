import {
    BadRequestException,
    Injectable,
    PayloadTooLargeException,
    UnsupportedMediaTypeException,
} from "@nestjs/common"
import {
    randomUUID,
} from "crypto"
import type {
    EntityManager,
} from "typeorm"
import {
    ObjectCannedACL,
} from "@aws-sdk/client-s3"
import {
    envConfig,
} from "@modules/env"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    S3BuildService,
    S3Provider,
    S3UploadService,
} from "@modules/s3"
import type {
    UploadAvatarParams,
    UploadAvatarResult,
} from "./types"
import {
    ALLOWED_AVATAR_MIME_TYPES,
    AVATAR_MIME_EXTENSION,
} from "./constants"

/**
 * Uploads a user's avatar image to S3 and persists the resulting public URL on
 * the user row.
 *
 * Avatars go to MinIO (always configured, unlike the optional DigitalOcean
 * provider) with a public-read ACL so the URL can be embedded directly. The
 * object key is namespaced per user and uuid-suffixed so re-uploads never
 * collide and the key never leaks the original client filename.
 */
@Injectable()
export class UploadAvatarService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3UploadService: S3UploadService,
        private readonly s3BuildService: S3BuildService,
    ) {}

    /**
     * Validate, upload and persist a new avatar for the given user.
     *
     * @param params - The authenticated user and the uploaded multipart file.
     * @returns The public URL of the stored avatar.
     */
    async execute(
        {
            user,
            file,
        }: UploadAvatarParams,
    ): Promise<UploadAvatarResult> {
        // the multipart `file` field is required — mirror multer's "no file" error
        if (!file) {
            throw new BadRequestException("No file uploaded (expected multipart field \"file\").")
        }

        // only allow image types so the avatar column never points at a non-image
        if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
            throw new UnsupportedMediaTypeException(
                `Unsupported avatar type "${file.mimetype}". Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(", ")}.`,
            )
        }

        // reject oversized uploads before spending an S3 round-trip
        const maxBytes = envConfig().profile.avatarMaxBytes
        if (file.size > maxBytes) {
            throw new PayloadTooLargeException(`Avatar exceeds the ${maxBytes}-byte limit.`)
        }

        // derive the storage key: per-user folder + random name + type-driven ext
        const extension = AVATAR_MIME_EXTENSION[file.mimetype]
        const key = `avatars/${user.id}/${randomUUID()}.${extension}`

        // push the in-memory buffer to MinIO with a public-read ACL
        await this.s3UploadService.buffer({
            name: key,
            buffer: file.buffer,
            acl: ObjectCannedACL.public_read,
            provider: S3Provider.Minio,
            contentType: file.mimetype,
        })

        // resolve the public URL clients will load the image from
        const url = this.s3BuildService.buildPublicObjectUrl({
            key,
            provider: S3Provider.Minio,
        })

        // persist the URL so `me` / profile reflect the new avatar immediately
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                avatar: url,
            },
        )

        return {
            url,
        }
    }
}
