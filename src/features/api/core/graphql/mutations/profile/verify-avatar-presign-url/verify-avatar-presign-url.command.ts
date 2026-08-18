import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    VerifyAvatarPresignUrlRequest,
} from "./graphql-types/request"

/** Params carried by {@link VerifyAvatarPresignUrlCommand}. */
export interface VerifyAvatarPresignUrlParams {
    /** The authenticated user whose avatar is being confirmed. */
    user: UserEntity
    /** The mutation request (uploaded object key). */
    request: VerifyAvatarPresignUrlRequest
}

/** Command: confirm a direct avatar upload and persist it on the user. */
export class VerifyAvatarPresignUrlCommand {
    constructor(
        readonly params: VerifyAvatarPresignUrlParams,
    ) {}
}
