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
} from "@modules/databases"

@Injectable()
export class TemplateCvsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(): Promise<Array<TemplateCVEntity>> {
        return this.queryBus.execute(
            new TemplateCvsQuery(
                {
                    request: undefined,
                }
            ),
        )
    }
}
