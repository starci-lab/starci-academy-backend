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
    SubmitPersonalGithubUrlCommand,
} from "./submit-personal-github-url.command"
import type {
    SubmitPersonalGithubUrlRequest,
} from "./graphql-types"

@Injectable()
/**
 * Thin command-bus hop so the resolver does not write enrollment columns
 * itself.
 */
export class SubmitPersonalGithubUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SubmitPersonalGithubUrlRequest>,
    ): Promise<EnrollmentEntity> {
        return this.commandBus.execute(
            new SubmitPersonalGithubUrlCommand(params),
        )
    }
}
