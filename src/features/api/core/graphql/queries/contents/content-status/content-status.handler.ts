import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
    ContentStatusQuery,
} from "./content-status.query"
import type {
    ContentStatusData,
} from "./graphql-types/response"

@QueryHandler(ContentStatusQuery)
@Injectable()
/**
 * Reads `user_contents` for isRead/isFavorite; anonymous callers get both false
 * so the FE can still render chips without inventing a logged-out state.
 */
export class ContentStatusHandler
    extends ICQRSHandler<ContentStatusQuery, ContentStatusData>
    implements IQueryHandler<ContentStatusQuery, ContentStatusData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: ContentStatusQuery,
    ): Promise<ContentStatusData> {
        const {
            request: {
                contentId,
            },
            user,
        } = query.params

        if (!user) {
            return {
                isRead: false,
                isFavorite: false,
            }
        }

        const userContent = await this.entityManager.findOne(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    contentId,
                },
            },
        )

        return {
            isRead: userContent?.isRead ?? false,
            isFavorite: userContent?.isFavorite ?? false,
        }
    }
}
