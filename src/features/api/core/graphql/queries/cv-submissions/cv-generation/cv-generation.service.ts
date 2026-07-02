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
    CvGenerationQuery,
} from "./cv-generation.query"
import {
    CvGenerationPayload,
    CvGenerationRequest,
} from "./graphql-types"

@Injectable()
export class CvGenerationService {
    constructor(
        private readonly queryBus: QueryBus,
    ) { }

    async execute(
        params: ExecuteParams<CvGenerationRequest>,
    ): Promise<CvGenerationPayload> {
        return this.queryBus.execute(
            new CvGenerationQuery(params),
        )
    }
}
