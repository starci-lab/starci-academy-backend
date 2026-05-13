import {
    UserEntity,
} from "@modules/databases"
import {
    ReviewCvRequest,
} from "./graphql-types"

export interface ReviewCvCommandParams {
    user: UserEntity
    request: ReviewCvRequest
}

export class ReviewCvCommand {
    constructor(
        readonly params: ReviewCvCommandParams,
    ) {}
}
