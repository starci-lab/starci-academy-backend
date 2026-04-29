import type {
    ForgotPasswordInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

export class ForgotPasswordInitCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordInitRequest>,
    ) {}
}