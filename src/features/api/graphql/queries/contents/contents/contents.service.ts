import {
    ContentEntity,
    ContentReferenceEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
    FindOptionsOrder,
} from "typeorm"
import {
    ContentsRequest,
    ContentsResponseData,
    ContentsSortBy,
} from "./graphql-types"
import {
    envConfig,
} from "@modules/env"
import {
    ContentTransformerService,
} from "../../../utils"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Lists module contents from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class ContentsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentTransformer: ContentTransformerService,
    ) {}

    async execute(
        {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        }: ExecuteParams<ContentsRequest>,
    ): Promise<ContentsResponseData> {
        const order: FindOptionsOrder<ContentEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as ContentsSortBy] = sort.order
        }
        const [
            contents,
            count,
        ] = await this.entityManager.findAndCount(
            ContentEntity,
            {
                where: {
                    module: {
                        id: moduleId,
                    },
                },
                order,
                relations: {
                    translations: true,
                    references: {
                        translations: true,
                    },
                },
                take: limit,
                skip: pageNumber * limit,
            },
        )
        for (const content of contents) {
            content.references = await this.entityManager.find(
                ContentReferenceEntity,
                {
                    where: {
                        contentId: content.id,
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            this.contentTransformer.transform(
                content,
                locale,
                content.defaultLocale ?? Locale.En,
            )
        }
        return {
            count,
            data: contents,
        }
    }
}
