import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
    KeycloakUserService,
} from "@modules/keycloak"
import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    EntityManager,
} from "typeorm"
import {
    KeycloakAuthResponse,
} from "../dtos"
import {
    KeycloakRegisterCommand,
} from "./register.command"

@CommandHandler(KeycloakRegisterCommand)
@Injectable()
export class KeycloakRegisterHandler
    extends ICQRSHandler<KeycloakRegisterCommand, KeycloakAuthResponse>
    implements ICommandHandler<KeycloakRegisterCommand, KeycloakAuthResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakRegisterCommand,
    ): Promise<KeycloakAuthResponse> {
        const keycloakUsername = command.params.email

        const keycloakUserId = await this.keycloakUserService.registerUserWithPassword({
            username: keycloakUsername,
            email: command.params.email,
            password: command.params.password,
            firstName: command.params.firstName,
            lastName: command.params.lastName,
        })

        await this.keycloakUserService.sendVerifyEmail(keycloakUserId)

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken({
            username: keycloakUsername,
            password: command.params.password,
        })

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string") {
            throw new UnauthorizedException("Invalid Keycloak access token payload")
        }

        const keycloakId = decoded.sub ?? keycloakUserId
        if (!keycloakId) {
            throw new UnauthorizedException("Missing Keycloak user id in token payload")
        }

        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId,
                },
            },
        )

        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: decoded.preferred_username ?? command.params.email,
                    email: decoded.email ?? command.params.email,
                    keycloakId,
                },
            )
            await this.entityManager.save(user)
        }

        return {
            id: user.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenType: tokenResponse.token_type,
            idToken: tokenResponse.id_token,
        }
    }
}
