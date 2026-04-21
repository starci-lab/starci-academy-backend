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
    RemoveFromFavoritesCommand,
} from "./remove-from-favorites.command"
import {
    RemoveFromFavoritesResponse,
} from "./graphql-types"

@CommandHandler(RemoveFromFavoritesCommand)
@Injectable()
export class RemoveFromFavoritesHandler
    extends ICQRSHandler<RemoveFromFavoritesCommand, RemoveFromFavoritesResponse>
    implements ICommandHandler<RemoveFromFavoritesCommand, RemoveFromFavoritesResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: RemoveFromFavoritesCommand,
    ): Promise<RemoveFromFavoritesResponse> {
        const {
            request: {
                contentId,
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
                    isFavorite: false,
                },
            )
        } else {
            userContent.isFavorite = false
        }

        const data = await this.entityManager.save(userContent)

        return {
            data,
        }
    }
}
