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
    UploadCvCommand,
} from "./upload-cv.command"
import {
    UploadCvData,
    UploadCvRequest,
} from "./graphql-types"

@Injectable()
/** CommandBus hop so the resolver does not import scoring enqueue. */
export class UploadCvService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<UploadCvRequest>,
    ): Promise<UploadCvData> {
        return this.commandBus.execute(
            new UploadCvCommand(params),
        )
    }
}
