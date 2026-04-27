import {
    UserEntity,
} from "@modules/databases"
import {
    SubmitCvPresignedUrlRequest,
} from "./graphql-types"

export interface SubmitCvPresignedUrlQueryParams {
    user: UserEntity
    request: SubmitCvPresignedUrlRequest
}

export class SubmitCvPresignedUrlQuery {
    constructor(
        readonly params: SubmitCvPresignedUrlQueryParams,
    ) {}
}
