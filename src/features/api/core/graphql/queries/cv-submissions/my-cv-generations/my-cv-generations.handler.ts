import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

@QueryHandler(MyCvGenerationsQuery)
@Injectable()
export class MyCvGenerationsHandler
    extends ICQRSHandler<MyCvGenerationsQuery, Array<UserCvGenerationEntity>>
    implements IQueryHandler<MyCvGenerationsQuery, Array<UserCvGenerationEntity>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: MyCvGenerationsQuery,
    ): Promise<Array<UserCvGenerationEntity>> {
        const {
            user,
            request: {
                limit,
                offset,
            },
        } = query.params

        if (!user) {
            return []
        }

        // clamp pagination server-side.
        const take = Math.min(
            Math.max(1,
                limit ?? DEFAULT_LIMIT),
            MAX_LIMIT,
        )
        const skip = Math.max(0,
            offset ?? 0)

        return this.entityManager.find(
            UserCvGenerationEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                take,
                skip,
            },
        )
    }
}
