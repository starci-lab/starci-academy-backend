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
    ReviseCvCommand,
} from "./revise-cv.command"
import {
    ReviseCvData,
    ReviseCvRequest,
} from "./graphql-types"

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
