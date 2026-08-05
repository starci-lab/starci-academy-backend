import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    StartTrialCommand,
} from "./start-trial.command"
import type {
    StartTrialRequest,
} from "./graphql-types/request"
import type {
    StartTrialResponseData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver stays persistence-free. */
export class StartTrialService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<StartTrialRequest>,
    ): Promise<StartTrialResponseData> {
        return this.commandBus.execute(
            new StartTrialCommand(params),
        )
    }
}
