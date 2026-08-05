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
    SplitCvFromTextCommand,
} from "./split-cv-from-text.command"
import {
    SplitCvFromTextRequest,
} from "./graphql-types/request"
import {
    SplitCvFromTextData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import the parser. */
export class SplitCvFromTextService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<SplitCvFromTextRequest>,
    ): Promise<SplitCvFromTextData> {
        return this.commandBus.execute(
            new SplitCvFromTextCommand(params),
        )
    }
}
