import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    SetupTwoFactorData,
} from "./graphql-types/response"
import {
    SetupTwoFactorCommand,
} from "./setup-two-factor.command"

@CommandHandler(SetupTwoFactorCommand)
@Injectable()
/** Mints and persists a pending encrypted TOTP secret without enabling it. */
export class SetupTwoFactorHandler
    extends ICQRSHandler<SetupTwoFactorCommand, SetupTwoFactorData>
    implements ICommandHandler<SetupTwoFactorCommand, SetupTwoFactorData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    protected override async process(
        command: SetupTwoFactorCommand,
    ): Promise<SetupTwoFactorData> {
        const { user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const secret = this.totpService.generateSecret()
        const encrypted = this.encryptionService.encrypt({
            plainText: secret,
        })
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorSecret: JSON.stringify(encrypted),
                twoFactorEnabled: false,
            },
        )

        return {
            secret,
            otpauthUrl: this.totpService.generateKeyUri({
                secret,
                accountName: user.email ?? user.username ?? user.id,
            }),
        }
    }
}
