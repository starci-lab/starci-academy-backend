import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvBlocksEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    MyCvBlocksQuery,
} from "./my-cv-blocks.query"
import {
    CvBlocksDocument,
} from "./graphql-types"

@QueryHandler(MyCvBlocksQuery)
@Injectable()
/**
 * Handler for `myCvBlocks` — the signed-in user's CV documents (block editor),
 * most recently updated first. Course-independent (no course scoping).
 */
export class MyCvBlocksHandler
    extends ICQRSHandler<MyCvBlocksQuery, Array<CvBlocksDocument>>
    implements IQueryHandler<MyCvBlocksQuery, Array<CvBlocksDocument>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: MyCvBlocksQuery,
    ): Promise<Array<CvBlocksDocument>> {
        const {
            user,
        } = query.params

        // auth-guarded resolver, but ExecuteParams types user optional
        if (!user) {
            return []
        }

        const rows = await this.entityManager.find(
            CvBlocksEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                order: {
                    updatedAt: "DESC",
                },
            },
        )

        return rows.map((row) => ({
            id: row.id,
            label: row.label,
            blocks: row.blocks,
            style: row.style,
            pdfCdnKey: row.pdfCdnKey,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }))
    }
}
