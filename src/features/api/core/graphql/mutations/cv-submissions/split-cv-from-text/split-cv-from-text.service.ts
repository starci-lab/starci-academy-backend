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
    SplitCvFromTextCommand,
} from "./split-cv-from-text.command"
import {
    SplitCvFromTextRequest,
    SplitCvFromTextData,
} from "./graphql-types"

@Injectable()
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
