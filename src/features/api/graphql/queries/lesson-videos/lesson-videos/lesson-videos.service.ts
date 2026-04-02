import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
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
    LessonVideosRequest,
    LessonVideosResponseData,
    LessonVideosSortBy,
} from "./graphql-types"
import {
    envConfig,
} from "@modules/env"
import {
    LessonVideoTransformerService,
} from "../../../utils"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Lists module lesson videos from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class LessonVideosService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
    ) {}

    async execute(
        {
            request: {
                filters: {
                    moduleId,
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        }: ExecuteParams<LessonVideosRequest>,
    ): Promise<LessonVideosResponseData> {
        const order: FindOptionsOrder<LessonVideoEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as LessonVideosSortBy] = sort.order
        }
        const [
            rows,
            count,
        ] = await this.entityManager.findAndCount(
            LessonVideoEntity,
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
        for (const lessonVideo of rows) {
            const fallbackLocale = lessonVideo.defaultLocale ?? Locale.En
            this.lessonVideoTransformer.transform(
                lessonVideo,
                locale,
                fallbackLocale,
            )
        }
        return {
            count,
            data: rows,
        }
    }
}
