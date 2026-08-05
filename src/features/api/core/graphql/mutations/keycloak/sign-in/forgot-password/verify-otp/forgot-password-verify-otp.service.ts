import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ForgotPasswordVerifyOtpCommand,
} from "./forgot-password-verify-otp.command"
import type {
    ForgotPasswordVerifyOtpRequest,
    ForgotPasswordVerifyOtpCommandResult,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

@Injectable()
/** Forwards reset-OTP verify to the command bus so the resolver can set cookies. */
export class ForgotPasswordVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ForgotPasswordVerifyOtpRequest>,
    ): Promise<ForgotPasswordVerifyOtpCommandResult> {
        return this.commandBus.execute(
            new ForgotPasswordVerifyOtpCommand(params),
        )
    }
}