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
    ToggleFavouriteCommand,
} from "./toggle-favourite.command"

@CommandHandler(ToggleFavouriteCommand)
@Injectable()
export class ToggleFavouriteHandler
    extends ICQRSHandler<ToggleFavouriteCommand, void>
    implements ICommandHandler<ToggleFavouriteCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: ToggleFavouriteCommand,
    ): Promise<void> {
        const {
            request: {
                contentId,
                isFavorite,
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
                    isFavorite,
                },
            )
        } else {
            userContent.isFavorite = isFavorite
        }
        await this.entityManager.save(userContent)
    }
}
