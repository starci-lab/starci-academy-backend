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
import {
    ILike,
    type EntityManager,
} from "typeorm"
import {
    SavedContentsQuery,
} from "./saved-contents.query"
import type {
    SavedContentsData,
} from "./graphql-types/response"

@QueryHandler(SavedContentsQuery)
@Injectable()
/**
 * Lists the caller's isFavorite user_contents with content->module->course loaded
 * so the FE can group "saved" by course; empty when unauthenticated.
 */
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
                search,
            },
            user,
        } = query.params

        if (!user) {
            return {
                contents: [],
                count: 0,
            }
        }

        // optional case-insensitive title search; filters on the joined content
        const trimmedSearch = search?.trim()

        const [
            userContents,
            count
        ] = await this.entityManager.findAndCount(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    isFavorite: true,
                    ...(trimmedSearch
                        ? {
                            content: {
                                title: ILike(`%${trimmedSearch}%`) 
                            } 
                        }
                        : {
                        }),
                },
                // load the owning module -> course so the client can group saved
                // contents by course ("saved" grouped, like the learning-history page)
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
