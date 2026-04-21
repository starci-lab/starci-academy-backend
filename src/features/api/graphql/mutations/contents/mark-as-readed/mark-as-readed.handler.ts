import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserContentEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
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
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    MarkAsReadedResponse,
} from "./graphql-types"

@CommandHandler(MarkAsReadedCommand)
@Injectable()
export class MarkAsReadedHandler
    extends ICQRSHandler<MarkAsReadedCommand, MarkAsReadedResponse>
    implements ICommandHandler<MarkAsReadedCommand, MarkAsReadedResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: MarkAsReadedCommand,
    ): Promise<MarkAsReadedResponse> {
        const {
            request: {
                contentId,
                readed,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({})
        }

        let userContent = await this.entityManager.findOne(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    contentId,
                },
            },
        )

        if (!userContent) {
            userContent = this.entityManager.create(
                UserContentEntity,
                {
                    userId: user.id,
                    contentId,
                    isRead: readed,
                },
            )
        } else {
            userContent.isRead = readed
        }

        const data = await this.entityManager.save(userContent)

        return {
            data,
        }
    }
}
