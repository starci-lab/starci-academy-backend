import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UploadCvRequest,
} from "./graphql-types/request"

/** CQRS envelope for registering an uploaded object key and enqueueing scoring. */
export class UploadCvCommand {
    constructor(
        readonly params: ExecuteParams<UploadCvRequest>,
    ) { }
}
