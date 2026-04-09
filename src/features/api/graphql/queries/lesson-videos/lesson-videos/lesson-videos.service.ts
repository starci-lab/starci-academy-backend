import {
    LessonVideoEntity,
    Locale
} from "@modules/databases"
import { ElasticsearchQueryBuilder, ElasticsearchService } from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    ExecuteParams,
} from "../../../../types"
import {
    LessonVideoTransformerService,
} from "../../../utils"
import {
    LessonVideosRequest,
    LessonVideosResponseData
} from "./graphql-types"

/**
 * Lists module lesson videos from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class LessonVideosService {
    constructor(
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
        private readonly elasticsearch: ElasticsearchService
    ) {}

    async execute(
        {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search
                },
            },
            locale,
        }: ExecuteParams<LessonVideosRequest>,
    ): Promise<LessonVideosResponseData> {
        const sort = sorts.map(s => ({
            [s.by]: {order: s.order.toLowerCase()},
        }))
        const query = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "moduleId.keyword": moduleId,
                    },
                },
            ],
            search,
            searchFields: ["title^3", "description", "caption"],
        });

        const { data: rows, count } = await this.elasticsearch.search<LessonVideoEntity>(
            LessonVideoEntity.name,
            {
                query,
                sort,
                from: pageNumber * limit,
                size: limit,
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
