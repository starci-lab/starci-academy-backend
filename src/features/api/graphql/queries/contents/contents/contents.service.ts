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
import _ from "lodash"

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
                },
                take: limit,
                skip: pageNumber * limit,
            },
        )
        const hydratedContents = _.cloneDeep(contents)
        for (const hydratedContent of hydratedContents) {
            const references = await this.entityManager.find(
                ContentReferenceEntity,
                {
                    where: {
                        content: {
                            id: hydratedContent.id,
                        },
                        translations: {
                            locale,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            const hydratedReferences = _.cloneDeep(references)
            hydratedContent.references = hydratedReferences
            this.contentTransformer.transform(
                hydratedContent,
                locale,
                hydratedContent.defaultLocale ?? Locale.En,
            )
        }
        return {
            count,
            data: hydratedContents,
        }
    }
}
