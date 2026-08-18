import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GenerateSubmitCvPresignUrlRequest,
} from "./graphql-types/request"

/** Named params bag (user + request) so the command does not inline an object type and stays free of GraphQL-only types. */
export interface GenerateSubmitCvPresignUrlParams {
    user: UserEntity
    request: GenerateSubmitCvPresignUrlRequest
}

/** CQRS envelope for issuing a signed PUT without proxying file bytes through the API. */
export class GenerateSubmitCvPresignUrlCommand {
    constructor(
        readonly params: GenerateSubmitCvPresignUrlParams,
    ) {}
}
