import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartTrialCommand,
} from "./start-trial.command"
import type {
    StartTrialRequest,
    StartTrialResponseData,
} from "./graphql-types"

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
