import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
    Locale,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
    FindOptionsOrder,
} from "typeorm"
import {
    LivestreamSessionTransformerService,
} from "../../../utils"
import {
    LivestreamSessionsQuery,
} from "./livestream-sessions.query"
import {
    LivestreamSessionsResponseData,
    LivestreamSessionsSortBy,
} from "./graphql-types"

@QueryHandler(LivestreamSessionsQuery)
@Injectable()
export class LivestreamSessionsHandler
    extends ICQRSHandler<LivestreamSessionsQuery, LivestreamSessionsResponseData>
    implements IQueryHandler<LivestreamSessionsQuery, LivestreamSessionsResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly livestreamSessionTransformer: LivestreamSessionTransformerService,
    ) {
        super()
    }

    protected override async process(
        query: LivestreamSessionsQuery,
    ): Promise<LivestreamSessionsResponseData> {
        const {
            request: {
                courseId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        } = query.params

        const order: FindOptionsOrder<LivestreamSessionEntity> = {}
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
