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
    GradeMockInterviewSessionCommand,
} from "./grade-mock-interview-session.command"
import {
    GradeMockInterviewSessionRequest,
    MockInterviewGradeSessionData,
} from "./graphql-types"

@Injectable()
export class GradeMockInterviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<GradeMockInterviewSessionRequest>,
    ): Promise<MockInterviewGradeSessionData> {
        return this.commandBus.execute(
            new GradeMockInterviewSessionCommand(params),
        )
    }
}
