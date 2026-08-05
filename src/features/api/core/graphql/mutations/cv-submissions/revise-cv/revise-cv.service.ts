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
    ReviseCvCommand,
} from "./revise-cv.command"
import {
    ReviseCvRequest,
} from "./graphql-types/request"
import {
    ReviseCvData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import the job-enqueue service. */
export class ReviseCvService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<ReviseCvRequest>,
    ): Promise<ReviseCvData> {
        return this.commandBus.execute(
            new ReviseCvCommand(params),
        )
    }
}
