import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UploadCvRequest,
} from "./graphql-types"

export class UploadCvCommand {
    constructor(
        readonly params: ExecuteParams<UploadCvRequest>,
    ) { }
}
