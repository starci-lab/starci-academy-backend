import {
    ExecuteParams,
} from "@features/api/types"
import {
    QueryBus,
} from "@modules/bussiness"
import {
    ChallengeEntity,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import SuperJSON from "superjson"
import {
    ChallengeRequest,
} from "@features/api/graphql/queries/challenges/challenge/graphql-types"
import {
    ChallengeHandler,
} from "./challenge.handler"
import {
    ChallengeQuery,
} from "./challenge.query"

@Injectable()
export class ChallengeQueryService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    async execute(
        params: ExecuteParams<ChallengeRequest>,
    ): Promise<ChallengeEntity> {
        const query = new ChallengeQuery(params)

        return this.queryBus.execute(
            new ChallengeHandler(
                query,
                this.s3ReadService,
                this.s3NameResolverService,
                this.superJson,
            ),
        )
    }
}
