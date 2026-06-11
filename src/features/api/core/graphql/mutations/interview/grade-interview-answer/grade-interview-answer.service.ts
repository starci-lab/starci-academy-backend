import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GradeInterviewAnswerCommand,
} from "./grade-interview-answer.command"
import {
    GradeInterviewAnswerRequest,
    InterviewGradeResultData,
} from "./graphql-types"

@Injectable()
export class GradeInterviewAnswerService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<GradeInterviewAnswerRequest>,
    ): Promise<InterviewGradeResultData> {
        return this.commandBus.execute(
            new GradeInterviewAnswerCommand(params),
        )
    }
}
