import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an avatar-upload verification whose key isn't under the caller's prefix. */
export type AvatarKeyOwnershipMismatchExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `verifyAvatarPresignUrl` is called with a key that does not
 * live under the caller's own `avatars/{userId}/` prefix — a client could
 * otherwise point their avatar at someone else's object.
 */
export class AvatarKeyOwnershipMismatchException extends AbstractException {
    constructor({
        originalError,
    }: AvatarKeyOwnershipMismatchExceptionMetadata) {
        super(
            "Avatar key does not belong to the authenticated user.",
            "AVATAR_KEY_OWNERSHIP_MISMATCH_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
