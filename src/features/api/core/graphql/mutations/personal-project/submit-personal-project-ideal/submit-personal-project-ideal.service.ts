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
    EnrollmentEntity,
} from "@modules/databases"
import {
    SubmitPersonalProjectIdealCommand,
} from "./submit-personal-project-ideal.command"
import type {
    SubmitPersonalProjectIdealRequest,
} from "./graphql-types"

@Injectable()
export class SubmitPersonalProjectIdealService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SubmitPersonalProjectIdealRequest>,
    ): Promise<EnrollmentEntity> {
        return this.commandBus.execute(
            new SubmitPersonalProjectIdealCommand(params),
        )
    }
}
