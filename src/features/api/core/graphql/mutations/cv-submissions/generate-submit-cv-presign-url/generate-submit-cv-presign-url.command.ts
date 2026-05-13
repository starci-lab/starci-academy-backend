import {
    UserEntity,
} from "@modules/databases"
import {
    GenerateSubmitCvPresignUrlRequest,
} from "./graphql-types"

export interface GenerateSubmitCvPresignUrlCommandParams {
    user: UserEntity
    request: GenerateSubmitCvPresignUrlRequest
}

export class GenerateSubmitCvPresignUrlCommand {
    constructor(
        readonly params: GenerateSubmitCvPresignUrlCommandParams,
    ) {}
}
