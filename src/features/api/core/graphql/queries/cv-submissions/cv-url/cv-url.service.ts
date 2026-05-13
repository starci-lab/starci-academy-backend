import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CvUrlQuery,
} from "./cv-url.query"
import {
    CvUrlRequest,
    CvUrlViewData,
} from "./graphql-types"

@Injectable()
export class CvUrlService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CvUrlRequest>,
    ): Promise<CvUrlViewData | null> {
        return this.queryBus.execute(
            new CvUrlQuery(params),
        )
    }
}
