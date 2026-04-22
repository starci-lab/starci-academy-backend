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
    AddToFavoritesCommand,
} from "./add-to-favorites.command"
import {
    AddToFavoritesResponse,
} from "./graphql-types"

@CommandHandler(AddToFavoritesCommand)
@Injectable()
export class AddToFavoritesHandler
    extends ICQRSHandler<AddToFavoritesCommand, AddToFavoritesResponse>
    implements ICommandHandler<AddToFavoritesCommand, AddToFavoritesResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: AddToFavoritesCommand,
    ): Promise<AddToFavoritesResponse> {
        const {
            request: {
                contentId,
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
                    isFavorite: true,
                },
            )
        } else {
            userContent.isFavorite = true
        }

        const data = await this.entityManager.save(userContent)

        return {
            data,
        }
    }
}
