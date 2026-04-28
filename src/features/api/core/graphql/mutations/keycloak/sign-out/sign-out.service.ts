import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignOutCommand,
} from "./sign-out.command"

/**
 * Service for signing out a user from Keycloak.
 */
@Injectable()
export class SignOutService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(refreshToken: string): Promise<undefined> {
        return this.commandBus.execute(
            new SignOutCommand(refreshToken),
        )
    }
}

