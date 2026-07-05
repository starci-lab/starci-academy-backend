import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvBlocksEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    UpdateCvBlocksCommand,
} from "./update-cv-blocks.command"
import {
    CvBlocksDocument,
} from "./graphql-types"

/**
 * Handler for `updateCvBlocks` — partial autosave of a CV document. Ownership
 * is enforced (the row must belong to the caller); missing/foreign rows 404.
 */
@CommandHandler(UpdateCvBlocksCommand)
@Injectable()
export class UpdateCvBlocksHandler
    extends ICQRSHandler<UpdateCvBlocksCommand, CvBlocksDocument>
    implements ICommandHandler<UpdateCvBlocksCommand, CvBlocksDocument> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: UpdateCvBlocksCommand,
    ): Promise<CvBlocksDocument> {
        const {
            request: {
                id,
                label,
                blocks,
                style,
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
            throw new NotFoundException("CV document not found")
        }

        if (label !== undefined) {
            entity.label = label
        }
        if (blocks !== undefined) {
            entity.blocks = blocks
        }
        if (style !== undefined) {
            entity.style = style
        }
        entity.pdfCdnKey = null

        const saved = await this.entityManager.save(entity)

        return {
            id: saved.id,
            label: saved.label,
            blocks: saved.blocks,
            style: saved.style,
            pdfCdnKey: saved.pdfCdnKey,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        }
    }
}
