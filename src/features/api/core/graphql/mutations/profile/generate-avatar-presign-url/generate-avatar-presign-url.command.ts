import {
    UserEntity,
} from "@modules/databases"
import {
    GenerateAvatarPresignUrlRequest,
} from "./graphql-types"

/** Params carried by {@link GenerateAvatarPresignUrlCommand}. */
export interface GenerateAvatarPresignUrlCommandParams {
    /** The authenticated user the avatar will belong to. */
    user: UserEntity
    /** The mutation request (intended content type). */
    request: GenerateAvatarPresignUrlRequest
}

/** Command: mint a presigned avatar-upload URL for the user. */
export class GenerateAvatarPresignUrlCommand {
    constructor(
        readonly params: GenerateAvatarPresignUrlCommandParams,
    ) {}
}
