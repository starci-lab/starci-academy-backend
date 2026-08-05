import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvBlocksEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CvDocumentNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    DeleteCvBlocksCommand,
} from "./delete-cv-blocks.command"
import {
    DeleteCvBlocksData,
} from "./graphql-types"

@CommandHandler(DeleteCvBlocksCommand)
@Injectable()
/**
 * Handler for `deleteCvBlocks` -- removes a CV document the caller owns.
 */
export class DeleteCvBlocksHandler
    extends ICQRSHandler<DeleteCvBlocksCommand, DeleteCvBlocksData>
    implements ICommandHandler<DeleteCvBlocksCommand, DeleteCvBlocksData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: DeleteCvBlocksCommand,
    ): Promise<DeleteCvBlocksData> {
        const {
            request: {
                id,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const entity = await this.entityManager.findOne(
            CvBlocksEntity,
            {
                where: {
                    id,
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!entity) {
            throw new CvDocumentNotFoundException({
                cvBlocksId: id,
            })
        }

        await this.entityManager.remove(entity)

        return {
            id,
        }
    }
}
