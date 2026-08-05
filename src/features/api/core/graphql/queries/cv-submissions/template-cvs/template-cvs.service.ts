import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    TemplateCvsQuery,
} from "./template-cvs.query"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"

@Injectable()
/**
 * Dispatches `templateCvs` through QueryBus so the resolver never constructs
 * the CQRS query itself.
 */
export class TemplateCvsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<void>,
    ): Promise<Array<TemplateCVEntity>> {
        return this.queryBus.execute(
            new TemplateCvsQuery(params),
        )
    }
}
