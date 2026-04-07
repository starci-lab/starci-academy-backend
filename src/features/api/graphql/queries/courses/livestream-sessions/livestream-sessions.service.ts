import {
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
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
    LivestreamSessionsRequest,
    LivestreamSessionsResponseData,
    LivestreamSessionsSortBy,
} from "./graphql-types"
import {
    envConfig,
} from "@modules/env"
import {
    LivestreamSessionTransformerService,
} from "../../../utils"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Lists livestream sessions for a course from primary PostgreSQL.
 */
@Injectable()
export class LivestreamSessionsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly livestreamSessionTransformer: LivestreamSessionTransformerService,
    ) {}

    async execute(
        {
            request: {
                courseId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        }: ExecuteParams<LivestreamSessionsRequest>,
    ): Promise<LivestreamSessionsResponseData> {
        const order: FindOptionsOrder<LivestreamSessionEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as LivestreamSessionsSortBy] = sort.order
        }
        const [
            livestreamSessions,
            count,
        ] = await this.entityManager.findAndCount(
            LivestreamSessionEntity,
            {
                where: {
                    course: {
                        id: courseId,
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
        for (const livestreamSession of livestreamSessions) {
            const fallbackLocale = livestreamSession.course?.defaultLocale ?? Locale.En
            this.livestreamSessionTransformer.transform(
                livestreamSession,
                locale,
                fallbackLocale,
            )
        }
        return {
            count,
            data: livestreamSessions,
        }
    }
}
