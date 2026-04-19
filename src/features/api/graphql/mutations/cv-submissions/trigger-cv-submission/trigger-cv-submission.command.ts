import {
    UserEntity,
} from "@modules/databases"
import {
    TriggerCvSubmissionRequest,
} from "./graphql-types"

export interface TriggerCvSubmissionCommandParams {
    user: UserEntity
    request: TriggerCvSubmissionRequest
}

export class TriggerCvSubmissionCommand {
    constructor(
        readonly params: TriggerCvSubmissionCommandParams,
    ) {}
}
