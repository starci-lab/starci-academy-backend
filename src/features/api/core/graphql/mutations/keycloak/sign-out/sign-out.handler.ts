import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SignOutCommand,
} from "./sign-out.command"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"

@CommandHandler(SignOutCommand)
@Injectable()
/**
 * Revokes the refresh token at Keycloak so a stolen cookie cannot be reused
 * after sign-out. Cookie clearing stays in the resolver (HTTP side-effect).
 */
export class SignOutHandler
    extends ICQRSHandler<SignOutCommand, undefined>
    implements ICommandHandler<SignOutCommand, undefined>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
    ) {
        super()
    }

    protected override async process(command: SignOutCommand): Promise<undefined> {
        await this.keycloakTokenService.revokeRefreshToken({
            refreshToken: command.refreshToken,
        })
        return undefined
    }
}

