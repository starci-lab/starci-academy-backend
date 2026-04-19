import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    QueryBus,
} from "@modules/bussiness"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengesRequest,
    ChallengesResponseData,
} from "@features/api/graphql/queries/challenges/challenges/graphql-types"
import {
    ChallengesQuery,
} from "./challenges.query"
import {
    ChallengesHandler,
} from "./challenges.handler"

@Injectable()
export class ChallengesService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    async execute(params: ExecuteParams<ChallengesRequest>): Promise<ChallengesResponseData> {
        const query = new ChallengesQuery(params)

        return this.queryBus.execute(
            new ChallengesHandler(
                query,
                this.elasticsearch,
            ),
        )
    }
}
