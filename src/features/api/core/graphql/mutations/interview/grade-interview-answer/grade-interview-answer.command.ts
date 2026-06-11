import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    GradeInterviewAnswerRequest,
} from "./graphql-types"

export class GradeInterviewAnswerCommand {
    constructor(
        readonly params: ExecuteParams<GradeInterviewAnswerRequest>,
    ) { }
}
