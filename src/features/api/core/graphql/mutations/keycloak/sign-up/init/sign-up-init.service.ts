import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignUpInitCommand,
} from "./sign-up-init.command"
import type {
    SignUpInitData,
    SignUpInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
export class SignUpInitService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignUpInitRequest>,
    ): Promise<SignUpInitData> {
        return this.commandBus.execute(
            new SignUpInitCommand(params),
        )
    }
}

