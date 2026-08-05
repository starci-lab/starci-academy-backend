import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CvGenerationQuery,
} from "./cv-generation.query"
import {
    CvGenerationRequest,
} from "./graphql-types/request"
import {
    CvGenerationPayload,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `cvGeneration` through QueryBus so the resolver never constructs
 * the CQRS query itself.
 */
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
