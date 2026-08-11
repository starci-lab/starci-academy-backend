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
    ConfirmTwoFactorCommand,
} from "./confirm-two-factor.command"

@CommandHandler(ConfirmTwoFactorCommand)
@Injectable()
/** Verifies the pending secret and promotes it to an active second factor. */
export class ConfirmTwoFactorHandler
    extends ICQRSHandler<ConfirmTwoFactorCommand, undefined>
    implements ICommandHandler<ConfirmTwoFactorCommand, undefined> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    protected override async process(
        command: ConfirmTwoFactorCommand,
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
        if (!current.twoFactorSecret) {
            throw new TwoFactorInvalidCodeException({
                userId: user.id,
            })
        }
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
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorEnabled: true,
            },
        )
        return undefined
    }
}
