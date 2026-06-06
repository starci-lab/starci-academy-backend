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
    ReactionService,
} from "@modules/bussiness"
import {
    MarkAsReadedCommand,
} from "./mark-as-readed.command"

@CommandHandler(MarkAsReadedCommand)
@Injectable()
export class MarkAsReadedHandler
    extends ICQRSHandler<MarkAsReadedCommand, void>
    implements ICommandHandler<MarkAsReadedCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly reactionService: ReactionService,
    ) {
        super()
    }

    protected override async process(
        command: MarkAsReadedCommand,
    ): Promise<void> {
        const {
            request: {
                contentId,
                readed,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
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
        await this.entityManager.save(userContent)

        // invalidate the cached view count so the next contentReactions query recomputes it
        await this.reactionService.invalidateViewCount(contentId)
    }
}
