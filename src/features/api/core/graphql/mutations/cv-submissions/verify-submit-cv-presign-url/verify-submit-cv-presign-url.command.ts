import {
    VerifySubmitCvPresignUrlRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../types"

export class VerifySubmitCvPresignUrlCommand {
    constructor(
        readonly params: ExecuteParams<VerifySubmitCvPresignUrlRequest>,
    ) {}
}
