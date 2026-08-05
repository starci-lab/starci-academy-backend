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
    GenerateCvCommand,
} from "./generate-cv.command"
import {
    GenerateCvData,
    GenerateCvRequest,
} from "./graphql-types"

@Injectable()
/** CommandBus hop so the resolver does not import the job-enqueue service. */
export class GenerateCvService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<GenerateCvRequest>,
    ): Promise<GenerateCvData> {
        return this.commandBus.execute(
            new GenerateCvCommand(params),
        )
    }
}
