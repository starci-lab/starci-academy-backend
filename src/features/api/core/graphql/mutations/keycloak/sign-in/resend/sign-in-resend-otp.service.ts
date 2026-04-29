import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignInResendOtpCommand,
} from "./sign-in-resend-otp.command"
import type {
    SignInInitData,
} from "../init/graphql-types"
import type {
    SignInResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
export class SignInResendOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignInResendOtpRequest>,
    ): Promise<SignInInitData> {
        return this.commandBus.execute(
            new SignInResendOtpCommand(params),
        )
    }
}
