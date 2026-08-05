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
    CreateCvBlocksCommand,
} from "./create-cv-blocks.command"
import {
    CvBlocksDocument,
} from "../../../queries/cv-submissions/my-cv-blocks/graphql-types/response"

@CommandHandler(CreateCvBlocksCommand)
@Injectable()
/**
 * Handler for `createCvBlocks` -- inserts a new CV document owned by the user.
 * Course-independent; `blocks`/`style` default to empty when omitted.
 */
export class CreateCvBlocksHandler
    extends ICQRSHandler<CreateCvBlocksCommand, CvBlocksDocument>
    implements ICommandHandler<CreateCvBlocksCommand, CvBlocksDocument> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: CreateCvBlocksCommand,
    ): Promise<CvBlocksDocument> {
        const {
            request: {
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

        const entity = this.entityManager.create(
            CvBlocksEntity,
            {
                user: {
                    id: user.id,
                },
                label: label ?? null,
                blocks: blocks ?? [],
                style: style ?? {
                },
            },
        )
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
