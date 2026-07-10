import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    S3BuildService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    VerifyAvatarPresignUrlCommand,
} from "./verify-avatar-presign-url.command"
import {
    VerifyAvatarPresignUrlResponseData,
} from "./graphql-types"
import {
    AVATAR_KEY_PREFIX,
} from "../shared/avatar"
import {
    AvatarKeyOwnershipMismatchException,
} from "@modules/exceptions"

/**
 * Confirms a direct avatar upload: authorises the key (must live under the
 * caller's own `avatars/{userId}/` prefix — never trust a client key), checks
 * the object really landed in MinIO, then persists its public URL on the user.
 */
@CommandHandler(VerifyAvatarPresignUrlCommand)
@Injectable()
export class VerifyAvatarPresignUrlHandler
    extends ICQRSHandler<VerifyAvatarPresignUrlCommand, VerifyAvatarPresignUrlResponseData>
    implements ICommandHandler<VerifyAvatarPresignUrlCommand, VerifyAvatarPresignUrlResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Verify the uploaded object + persist the avatar URL.
     *
     * @param command - {@link VerifyAvatarPresignUrlCommand}
     * @returns whether the object existed + the persisted public URL.
     */
    protected override async process(
        command: VerifyAvatarPresignUrlCommand,
    ): Promise<VerifyAvatarPresignUrlResponseData> {
        const {
            user,
            request,
        } = command.params
        // authorization: the key must belong to THIS user's avatar folder — a
        // client could otherwise point their avatar at someone else's object
        const ownedPrefix = `${AVATAR_KEY_PREFIX}/${user.id}/`
        if (!request.key.startsWith(ownedPrefix)) {
            throw new AvatarKeyOwnershipMismatchException({
            })
        }
        // confirm the client actually completed the PUT before persisting
        const exists = await this.s3ReadService.exists({
            key: request.key,
            provider: S3Provider.Minio,
        })
        if (!exists) {
            // nothing uploaded → leave the current avatar untouched
            return {
                uploaded: false,
                url: null,
            }
        }
        // resolve the public URL + persist it so `me` / profile reflect it
        const url = this.s3BuildService.buildPublicObjectUrl({
            key: request.key,
            provider: S3Provider.Minio,
        })
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
            uploaded: true,
            url,
        }
    }
}
