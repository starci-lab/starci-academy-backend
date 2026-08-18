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
} from "./graphql-types/request"
import type {
    ForgotPasswordVerifyOtpResponse,
} from "./graphql-types/response"
import {
    ExecuteParams,
} from "../../../../../../types/execute"

@Injectable()
/** Forwards reset-OTP verify to the command bus so the resolver can set cookies. */
export class ForgotPasswordVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ForgotPasswordVerifyOtpRequest>,
    ): Promise<ForgotPasswordVerifyOtpResponse> {
        return this.commandBus.execute(
            new ForgotPasswordVerifyOtpCommand(params),
        )
    }
}