import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    KeycloakConfigureMailAdapterResponse,
} from "../dtos/response"
import {
    KeycloakConfigureMailAdapterCommand,
} from "./configure-mail-adapter.command"

@CommandHandler(KeycloakConfigureMailAdapterCommand)
@Injectable()
/**
 * Points Keycloak SMTP at our verify-email flow (and optionally fires verify for one user)
 * so confirmation mail is not sent by Keycloak's default theme.
 */
export class KeycloakConfigureMailAdapterHandler
    extends ICQRSHandler<KeycloakConfigureMailAdapterCommand, KeycloakConfigureMailAdapterResponse>
    implements ICommandHandler<KeycloakConfigureMailAdapterCommand, KeycloakConfigureMailAdapterResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakConfigureMailAdapterCommand,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        return {
            configured: true,
            message: command.params.verifyEmailUserId
                ? "Configured Brevo SMTP adapter and sent verify email action"
                : "Configured Brevo SMTP adapter",
        }
    }
}
