import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserContentEntity
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
    SavedContentsQuery,
} from "./saved-contents.query"
import type {
    SavedContentsData,
} from "./graphql-types"

@QueryHandler(SavedContentsQuery)
@Injectable()
export class SavedContentsHandler
    extends ICQRSHandler<SavedContentsQuery, SavedContentsData>
    implements IQueryHandler<SavedContentsQuery, SavedContentsData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: SavedContentsQuery,
    ): Promise<SavedContentsData> {
        const {
            request: {
                skip = 0,
                take = 20,
            },
            user,
        } = query.params

        if (!user) {
            return {
                contents: [],
                count: 0,
            }
        }

        const [
            userContents, 
            count
        ] = await this.entityManager.findAndCount(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    isFavorite: true,
                },
                // load the owning module → course so the client can group saved
                // contents by course ("Đã lưu" grouped, like the learning-history page)
                relations: {
                    content: {
                        module: {
                            course: true,
                        },
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                skip,
                take,
            },
        )

        const contents = userContents
            .map((uc) => uc.content)
            .filter(Boolean)

        return {
            contents,
            count,
        }
    }
}
