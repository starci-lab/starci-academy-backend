import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    Locale,
} from "@modules/databases"
import type {
    LoginVerifyOtpData,
    LoginVerifyOtpInput,
} from "./graphql-types"
import {
    LoginVerifyOtpCommand,
} from "./login-verify-otp.command"

@Injectable()
export class LoginVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        input: LoginVerifyOtpInput,
        locale: Locale,
    ): Promise<LoginVerifyOtpData> {
        return this.commandBus.execute(
            new LoginVerifyOtpCommand({
                input,
                locale,
            }),
        )
    }
}

