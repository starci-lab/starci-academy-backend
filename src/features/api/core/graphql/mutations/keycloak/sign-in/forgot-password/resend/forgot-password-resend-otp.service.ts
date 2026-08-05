import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ForgotPasswordResendOtpCommand,
} from "./forgot-password-resend-otp.command"
import type {
    ForgotPasswordResendOtpRequest,
} from "./graphql-types/request"
import type {
    SignInInitData,
} from "../../init/graphql-types/response"
import {
    ExecuteParams,
} from "../../../../../../types/execute"

@Injectable()
/** Forwards reset-OTP resend to the command bus so the resolver stays a thin leaf. */
export class ForgotPasswordResendOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ForgotPasswordResendOtpRequest>,
    ): Promise<SignInInitData> {
        return this.commandBus.execute(
            new ForgotPasswordResendOtpCommand(params),
        )
    }
}