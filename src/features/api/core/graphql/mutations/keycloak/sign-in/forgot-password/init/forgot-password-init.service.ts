import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ForgotPasswordInitCommand,
} from "./forgot-password-init.command"
import type {
    ForgotPasswordInitRequest,
} from "./graphql-types"
import type {
    SignInInitData,
} from "../../init/graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

@Injectable()
export class ForgotPasswordInitService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ForgotPasswordInitRequest>,
    ): Promise<SignInInitData> {
        return this.commandBus.execute(
            new ForgotPasswordInitCommand(params),
        )
    }
}