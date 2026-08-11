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
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    DisableTwoFactorCommand,
} from "./disable-two-factor.command"

@CommandHandler(DisableTwoFactorCommand)
@Injectable()
/** Requires proof while enabled, then clears both active and pending TOTP state. */
export class DisableTwoFactorHandler
    extends ICQRSHandler<DisableTwoFactorCommand, undefined>
    implements ICommandHandler<DisableTwoFactorCommand, undefined> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    protected override async process(
        command: DisableTwoFactorCommand,
    ): Promise<undefined> {
        const { request, user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const current = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: user.id,
                },
            },
        )
        if (!current) {
            throw new UserNotFoundException({
                id: user.id,
            })
        }
        if (current.twoFactorEnabled && current.twoFactorSecret) {
            const secret = this.encryptionService.decrypt({
                payload: JSON.parse(current.twoFactorSecret),
            })
            if (!this.totpService.verify({
                secret,
                token: request.code,
            })) {
                throw new TwoFactorInvalidCodeException({
                    userId: user.id,
                })
            }
        }
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        )
        return undefined
    }
}
