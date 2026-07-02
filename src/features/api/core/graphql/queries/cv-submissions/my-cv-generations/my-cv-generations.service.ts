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
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"
import {
    MyCvGenerationsRequest,
} from "./graphql-types"

@Injectable()
export class MyCvGenerationsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) { }

    async execute(
        params: ExecuteParams<MyCvGenerationsRequest>,
    ): Promise<Array<UserCvGenerationEntity>> {
        return this.queryBus.execute(
            new MyCvGenerationsQuery(params),
        )
    }
}
