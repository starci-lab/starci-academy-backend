import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CvBlocksEntity,
} from "@modules/databases/postgresql/primary/entities/cv-blocks.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CvDocumentNotFoundException,
} from "@modules/platform/exceptions/errors/cv/cv-document-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
    UpdateCvBlocksCommand,
} from "./update-cv-blocks.command"
import {
    CvBlocksDocument,
} from "../../../queries/cv-submissions/my-cv-blocks/graphql-types/response"

@CommandHandler(UpdateCvBlocksCommand)
@Injectable()
/**
 * Handler for `updateCvBlocks` -- partial autosave of a CV document. Ownership
 * is enforced (the row must belong to the caller); missing/foreign rows 404.
 */
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
            throw new CvDocumentNotFoundException({
                cvBlocksId: id,
            })
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
