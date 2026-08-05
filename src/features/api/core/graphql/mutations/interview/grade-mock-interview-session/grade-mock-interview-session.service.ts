import {
    ExecuteParams,
} from "../../../../types/execute"
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
} from "./graphql-types/request"
import {
    MockInterviewGradeSessionData,
} from "./graphql-types/response"

@Injectable()
/** Forwards grading to the command bus so the resolver stays a thin GraphQL leaf. */
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
