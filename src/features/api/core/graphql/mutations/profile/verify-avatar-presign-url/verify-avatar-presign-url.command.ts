import {
    UserEntity,
} from "@modules/databases"
import {
    VerifyAvatarPresignUrlRequest,
} from "./graphql-types"

/** Params carried by {@link VerifyAvatarPresignUrlCommand}. */
export interface VerifyAvatarPresignUrlCommandParams {
    /** The authenticated user whose avatar is being confirmed. */
    user: UserEntity
    /** The mutation request (uploaded object key). */
    request: VerifyAvatarPresignUrlRequest
}

/** Command: confirm a direct avatar upload and persist it on the user. */
export class VerifyAvatarPresignUrlCommand {
    constructor(
        readonly params: VerifyAvatarPresignUrlCommandParams,
    ) {}
}
