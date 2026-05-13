import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ReviewCvRequest,
} from "./graphql-types"

export interface ReviewCvCommandParams {
    user: UserEntity
    request: ReviewCvRequest
    locale?: Locale
}

export class ReviewCvCommand {
    constructor(
        readonly params: ReviewCvCommandParams,
    ) {}
}
