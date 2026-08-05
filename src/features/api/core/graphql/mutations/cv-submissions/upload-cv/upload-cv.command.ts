import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UploadCvRequest,
} from "./graphql-types"

/** CQRS envelope for registering an uploaded object key and enqueueing scoring. */
export class UploadCvCommand {
    constructor(
        readonly params: ExecuteParams<UploadCvRequest>,
    ) { }
}
